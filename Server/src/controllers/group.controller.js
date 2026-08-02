import groupService from '../services/group.service.js';
import { toGroupDto, toGroupSummaryDto } from '../mappers/group.mapper.js';
import { toMemberDto } from '../mappers/member.mapper.js';
import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { created, noContent, success } from '../utils/response.js';

const create = asyncHandler(async (req, res) => {
	const { name, description, image, visibility } = req.body || {};
	const group = await groupService.createGroup({ ownerId: req.user._id, name, description: description || '', image, visibility });
	return created(res, { message: 'Group created successfully', data: { group: toGroupDto(group) } });
});

const list = asyncHandler(async (req, res) => {
	const { page, limit } = req.query;
	const groups = await groupService.listMyGroups({ userId: req.user._id, page, limit });
	return success(res, {
		message: 'Groups fetched successfully',
		data: { groups: groups.map(({ group }) => toGroupDto(group)), pagination: { page, limit } },
	});
});

const browse = asyncHandler(async (req, res) => {
	const { page, limit } = req.query;
	const result = await groupService.listPublicGroupsToBrowse({ userId: req.user._id, page, limit });
	return success(res, {
		message: 'Browse groups fetched successfully',
		data: {
			groups: result.groups.map(toGroupDto),
			pagination: {
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: result.totalPages,
				hasNextPage: result.hasNextPage,
			},
		},
	});
});

const getById = asyncHandler(async (req, res) => {
	const summary = await groupService.getGroupSummary({ groupId: req.params.groupId, requesterId: req.user._id });
	return success(res, { message: 'Group fetched successfully', data: { group: toGroupSummaryDto(summary) } });
});

const join = asyncHandler(async (req, res) => {
	const membership = await groupService.joinGroup({ groupId: req.params.groupId, userId: req.user._id });
	return created(res, { message: 'Joined group successfully', data: { membership: { id: membership._id.toString(), role: membership.role, joinedAt: membership.joinedAt } } });
});

const leave = asyncHandler(async (req, res) => {
	await groupService.leaveGroup({ groupId: req.params.groupId, userId: req.user._id });
	return noContent(res);
});

const addMember = asyncHandler(async (req, res) => {
	const membership = await groupService.addMember({
		groupId: req.params.groupId,
		actorId: req.user._id,
		userId: req.body.userId,
		role: req.body.role,
	});
	return created(res, { message: 'Member added successfully', data: { member: toMemberDto(membership) } });
});

const update = asyncHandler(async () => { throw new NotImplementedError('Group update'); });
const remove = asyncHandler(async () => { throw new NotImplementedError('Group deletion'); });

export { addMember, browse, create, getById, join, leave, list, remove, update };
