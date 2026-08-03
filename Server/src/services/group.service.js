import Document from '../models/Document.js';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import presenceService from './presence.services.js';
import workspacePromptService from './rag/workspacePrompt.service.js';
import { GROUP_PERMISSIONS } from '../constants/permissions.js';
import { GROUP_ROLES } from '../constants/roles.js';
import { AuthorizationError, ConflictError, NotFoundError } from '../utils/AppError.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { validateGroupRole, validateNewGroup } from '../validators/group.validator.js';
import eventBus from './eventBus.service.js';
import User from '../models/User.js';

export function createGroupService({ logger = defaultLogger } = {}) {
	assertLogger(logger);

	async function requireActiveGroup(groupId) {
		const group = await Group.findOne({ _id: groupId, archived: false });
		if (!group) throw new NotFoundError('Group');
		return group;
	}

	async function requireActiveMembership(groupId, userId) {
		const membership = await GroupMember.findOne({ group: groupId, user: userId, banned: false });
		if (!membership) throw new AuthorizationError('You are not an active member of this group');
		return membership;
	}

	async function verifyMemberAccess({ groupId, userId }) {
		return requireActiveMembership(groupId, userId);
	}

	async function requirePermission(groupId, userId, permission) {
		const membership = await requireActiveMembership(groupId, userId);
		if (!GROUP_PERMISSIONS[permission]?.includes(membership.role)) {
			throw new AuthorizationError('You do not have permission to perform this action');
		}
		return membership;
	}

	async function createGroup({ ownerId, name, description = '', image, visibility = 'private', aiConfiguration }) {
		validateNewGroup({ name, visibility });

		let promptTemplateId = null;
		if (aiConfiguration) {
			try {
				const template = await workspacePromptService.getOrCreateWorkspacePrompt(aiConfiguration, logger);
				promptTemplateId = template?._id || null;
			} catch (err) {
				logger.error('Failed to resolve PromptTemplate during group creation:', err);
			}
		}

		const group = await Group.create({
			name: name.trim(),
			description: description.trim(),
			image: image?.trim() || null,
			visibility,
			owner: ownerId,
			createdBy: ownerId,
			...(aiConfiguration ? { aiConfiguration } : {}),
			...(promptTemplateId ? { promptTemplate: promptTemplateId } : {}),
		});

		try {
			await GroupMember.create({ group: group._id, user: ownerId, role: GROUP_ROLES.OWNER });
			return group;
		} catch (error) {
			try {
				await Group.deleteOne({ _id: group._id });
			} catch (cleanupError) {
				logger.error('Failed to clean up partially created group', { error: cleanupError, groupId: group._id.toString() });
			}
			throw error;
		}
	}

	async function getAIConfiguration({ groupId, requesterId }) {
		await requireActiveGroup(groupId);
		await requireActiveMembership(groupId, requesterId);
		const group = await Group.findById(groupId).populate('promptTemplate').lean();
		return {
			aiConfiguration: group.aiConfiguration || {},
			promptTemplate: group.promptTemplate || null,
		};
	}

	async function configureAI({ groupId, actorId, aiConfiguration }) {
		await requirePermission(groupId, actorId, 'MANAGE_MEMBERS');
		const template = await workspacePromptService.getOrCreateWorkspacePrompt(aiConfiguration, logger);
		const group = await Group.findByIdAndUpdate(
			groupId,
			{
				$set: {
					aiConfiguration,
					promptTemplate: template._id,
				},
			},
			{ new: true }
		).populate('promptTemplate');
		eventBus.publish('AI_CONFIGURATION_UPDATED', {
			groupId: groupId.toString(),
			actorId: actorId.toString(),
		});
		return { group, promptTemplate: template };
	}

	async function joinGroup({ groupId, userId }) {
		const group = await requireActiveGroup(groupId);
		if (group.visibility !== 'public') throw new AuthorizationError('This group requires an invitation');
		const existing = await GroupMember.findOne({ group: groupId, user: userId });
		if (existing?.banned) throw new AuthorizationError('You are banned from this group');
		if (existing) return existing;
		try {
			const membership = await GroupMember.create({ group: groupId, user: userId });
			eventBus.publish('MEMBER_JOINED', { groupId: groupId.toString(), userId: userId.toString(), userName: (await User.findById(userId).select('name username').lean())?.name });
			return membership;
		} catch (error) {
			if (error?.code === 11000) return GroupMember.findOne({ group: groupId, user: userId });
			throw error;
		}
	}

	async function addMember({ groupId, actorId, userId, role = GROUP_ROLES.MEMBER }) {
		validateGroupRole(role);
		await requirePermission(groupId, actorId, 'MANAGE_MEMBERS');
		const existing = await GroupMember.findOne({ group: groupId, user: userId });
		if (existing && !existing.banned) throw new ConflictError('User is already a group member');
		if (existing) {
			existing.banned = false;
			existing.role = role;
			existing.joinedAt = new Date();
			const membership = await existing.save();
			eventBus.publish('MEMBER_JOINED', { groupId: groupId.toString(), userId: userId.toString(), userName: (await User.findById(userId).select('name username').lean())?.name });
			return membership;
		}
		const membership = await GroupMember.create({ group: groupId, user: userId, role });
		eventBus.publish('MEMBER_JOINED', { groupId: groupId.toString(), userId: userId.toString(), userName: (await User.findById(userId).select('name username').lean())?.name });
		return membership;
	}

	async function leaveGroup({ groupId, userId }) {
		const membership = await requireActiveMembership(groupId, userId);
		if (membership.role === GROUP_ROLES.OWNER) throw new ConflictError('Transfer group ownership before leaving');
		await GroupMember.deleteOne({ _id: membership._id });
		eventBus.publish('MEMBER_LEFT', { groupId: groupId.toString(), userId: userId.toString(), userName: (await User.findById(userId).select('name username').lean())?.name });
	}

	async function listMembers({ groupId, requesterId }) {
		await requireActiveGroup(groupId);
		await requireActiveMembership(groupId, requesterId);
		const members = await GroupMember.find({ group: groupId, banned: false })
			.populate('user', 'name username email status')
			.sort({ joinedAt: 1 })
			.lean();

		return members.map((m) => {
			const uId = m.user?._id?.toString?.() || m.user?.id || m.user?.toString?.();
			const liveStatus = uId ? presenceService.getPresence({ userId: uId }).status : 'offline';
			return {
				id: m._id.toString(),
				role: m.role,
				joinedAt: m.joinedAt,
				status: liveStatus,
				user: m.user ? {
					id: uId,
					_id: uId,
					name: m.user.name,
					username: m.user.username,
					email: m.user.email,
					status: liveStatus,
				} : null,
			};
		});
	}

	async function getGroupSummary({ groupId, requesterId }) {
		const group = await requireActiveGroup(groupId);
		await requireActiveMembership(groupId, requesterId);
		const [memberCount, documentCount, members] = await Promise.all([
			GroupMember.countDocuments({ group: groupId, banned: false }),
			Document.countDocuments({ group: groupId }),
			listMembers({ groupId, requesterId }),
		]);
		return { group, memberCount, documentCount, members };
	}

	async function listMyGroups({ userId, page = 1, limit = 30 }) {
		const memberships = await GroupMember.find({ user: userId, banned: false })
			.select('group role joinedAt')
			.sort({ joinedAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.populate({ path: 'group', match: { archived: false } })
			.lean();
		return memberships.filter(({ group }) => group);
	}

	async function listPublicGroupsToBrowse({ userId, page = 1, limit = 30 }) {
		const pageNum = Math.max(1, parseInt(page, 10) || 1);
		const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));

		const myMemberships = await GroupMember.find({ user: userId, banned: false })
			.select('group')
			.lean();
		const joinedGroupIds = myMemberships.map((m) => m.group);

		const query = {
			visibility: 'public',
			archived: false,
			_id: { $nin: joinedGroupIds },
		};

		const [groups, total] = await Promise.all([
			Group.find(query)
				.sort({ createdAt: -1 })
				.skip((pageNum - 1) * limitNum)
				.limit(limitNum)
				.lean(),
			Group.countDocuments(query),
		]);

		const totalPages = Math.ceil(total / limitNum) || 1;

		return {
			groups,
			page: pageNum,
			limit: limitNum,
			total,
			totalPages,
			hasNextPage: pageNum < totalPages,
		};
	}

	return { addMember, configureAI, createGroup, getAIConfiguration, getGroupSummary, joinGroup, leaveGroup, listMembers, listMyGroups, listPublicGroupsToBrowse, verifyMemberAccess };
}

const groupService = createGroupService();
export default groupService;
