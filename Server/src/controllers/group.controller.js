import groupService from '../services/group.service.js';
import { toGroupDto, toGroupSummaryDto } from '../mappers/group.mapper.js';
import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { created, noContent, success } from '../utils/response.js';
import { validateNewGroup } from '../validators/group.validator.js';
import { validatePagination } from '../validators/message.validator.js';

const create = asyncHandler(async (req, res) => {
	const { name, description, image, visibility } = req.body || {};
	validateNewGroup({ name, visibility });
	const group = await groupService.createGroup({ ownerId: req.user._id, name, description: description || '', image, visibility });
	return created(res, { message: 'Group created successfully', data: { group: toGroupDto(group) } });
});

const list = asyncHandler(async (req, res) => {
	const { page, limit } = validatePagination(req.query || {});
	const groups = await groupService.listMyGroups({ userId: req.user._id, page, limit });
	return success(res, {
		message: 'Groups fetched successfully',
		data: { groups: groups.map(({ group }) => toGroupDto(group)), pagination: { page, limit } },
	});
});

const getById = asyncHandler(async (req, res) => {
	const summary = await groupService.getGroupSummary({ groupId: req.params.id, requesterId: req.user._id });
	return success(res, { message: 'Group fetched successfully', data: { group: toGroupSummaryDto(summary) } });
});

const join = asyncHandler(async (req, res) => {
	const membership = await groupService.joinGroup({ groupId: req.params.id, userId: req.user._id });
	return created(res, { message: 'Joined group successfully', data: { membership: { id: membership._id.toString(), role: membership.role, joinedAt: membership.joinedAt } } });
});

const leave = asyncHandler(async (req, res) => {
	await groupService.leaveGroup({ groupId: req.params.id, userId: req.user._id });
	return noContent(res);
});

const update = asyncHandler(async () => { throw new NotImplementedError('Group update'); });
const remove = asyncHandler(async () => { throw new NotImplementedError('Group deletion'); });

export { create, getById, join, leave, list, remove, update };
