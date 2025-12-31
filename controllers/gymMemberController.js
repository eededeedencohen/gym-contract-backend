const GymMember = require("../models/gymMemberModel");
const catchAsync = require("../utils/catchAsync");

exports.getAllMembers = catchAsync(async (req, res, next) => {
  const members = await GymMember.find();

  res.status(200).json({
    status: "success",
    results: members.length,
    data: { members },
  });
});

exports.getMember = catchAsync(async (req, res, next) => {
  const member = await GymMember.findById(req.params.id);

  if (!member) {
    return res
      .status(404)
      .json({ status: "fail", message: "Member not found" });
  }

  res.status(200).json({
    status: "success",
    data: { member },
  });
});

exports.createMember = catchAsync(async (req, res, next) => {
  const newMember = await GymMember.create(req.body);

  res.status(201).json({
    status: "success",
    data: { member: newMember },
  });
});

exports.updateMember = catchAsync(async (req, res, next) => {
  const member = await GymMember.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { member },
  });
});

exports.deleteMember = catchAsync(async (req, res, next) => {
  await GymMember.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
