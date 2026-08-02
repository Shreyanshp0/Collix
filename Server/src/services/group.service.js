import Document from '../models/Document.js';
import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import { GROUP_PERMISSIONS } from '../constants/permissions.js';
import { GROUP_ROLES } from '../constants/roles.js';
import { AuthorizationError, ConflictError, NotFoundError } from '../utils/AppError.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { validateGroupRole, validateNewGroup } from '../validators/group.validator.js';

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

	async function createGroup({ ownerId, name, description = '', image, visibility = 'private' }) {
		validateNewGroup({ name, visibility });
		const group = await Group.create({
			name: name.trim(), description: description.trim(), image: image?.trim() || null,
			visibility, owner: ownerId, createdBy: ownerId,
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

	async function joinGroup({ groupId, userId }) {
		const group = await requireActiveGroup(groupId);
		if (group.visibility !== 'public') throw new AuthorizationError('This group requires an invitation');
		const existing = await GroupMember.findOne({ group: groupId, user: userId });
		if (existing?.banned) throw new AuthorizationError('You are banned from this group');
		if (existing) return existing;
		try {
			return await GroupMember.create({ group: groupId, user: userId });
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
			return existing.save();
		}
		return GroupMember.create({ group: groupId, user: userId, role });
	}

	async function leaveGroup({ groupId, userId }) {
		const membership = await requireActiveMembership(groupId, userId);
		if (membership.role === GROUP_ROLES.OWNER) throw new ConflictError('Transfer group ownership before leaving');
		await GroupMember.deleteOne({ _id: membership._id });
	}

	async function getGroupSummary({ groupId, requesterId }) {
		const group = await requireActiveGroup(groupId);
		await requireActiveMembership(groupId, requesterId);
		const [memberCount, documentCount] = await Promise.all([
			GroupMember.countDocuments({ group: groupId, banned: false }),
			Document.countDocuments({ group: groupId }),
		]);
		return { group, memberCount, documentCount };
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

	return { addMember, createGroup, getGroupSummary, joinGroup, leaveGroup, listMyGroups, verifyMemberAccess };
}

const groupService = createGroupService();
export default groupService;
