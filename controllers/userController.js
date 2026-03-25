const prisma = require("../lib/prisma");
const { ok, fail, notFound, serverError, hashPassword, comparePassword } = require("../utils");

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data:  {
        ...(name     !== undefined && { name }),
        ...(phone    !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(avatar   !== undefined && { avatar }),
      },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, role: true, location: true, createdAt: true,
      },
    });
    return ok(res, user, "Profile updated");
  } catch (e) { return serverError(res, e, "updateProfile"); }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return fail(res, "All fields are required");
    if (new_password.length < 6)
      return fail(res, "Password must be at least 6 characters");

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return notFound(res, "User not found");

    if (!(await comparePassword(current_password, user.password)))
      return fail(res, "Current password is incorrect");

    await prisma.user.update({
      where: { id: req.user.id },
      data:  { password: await hashPassword(new_password) },
    });

    return ok(res, null, "Password changed successfully");
  } catch (e) { return serverError(res, e, "changePassword"); }
};
