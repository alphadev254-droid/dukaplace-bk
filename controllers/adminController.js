const prisma = require("../lib/prisma");
const { ok, fail, notFound, forbidden, serverError, slugify } = require("../utils");

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenue, newUsersToday] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: "delivered" }, _sum: { amount: true } }),
      prisma.user.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return ok(res, {
      totalUsers,
      totalProducts,
      totalOrders,
      revenue:      parseFloat(revenue._sum.amount || 0),
      newUsersToday,
    });
  } catch (e) { return serverError(res, e, "getStats"); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        location: true, isVerified: true, isActive: true, createdAt: true,
      },
    });
    return ok(res, users);
  } catch (e) { return serverError(res, e, "getAllUsers"); }
};

exports.verifyUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: true } });
    return ok(res, null, "User verified");
  } catch (e) { return serverError(res, e, "verifyUser"); }
};

exports.deactivateUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user)            return notFound(res, "User not found");
    if (user.role === "admin") return forbidden(res, "Cannot deactivate admin users");

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return ok(res, null, "User deactivated");
  } catch (e) { return serverError(res, e, "deactivateUser"); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user)                 return notFound(res, "User not found");
    if (user.role === "admin") return forbidden(res, "Cannot delete admin users");
    if (user.isActive)         return fail(res, "User must be deactivated first");

    await prisma.user.delete({ where: { id: req.params.id } });
    return ok(res, null, "User deleted");
  } catch (e) { return serverError(res, e, "deleteUser"); }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, title: true, images: { take: 1, orderBy: { displayOrder: "asc" } } } },
        buyer:   { select: { id: true, name: true } },
        seller:  { select: { id: true, name: true } },
      },
    });

    const data = orders.map((o) => ({
      id:              o.id,
      productId:       o.productId,
      productTitle:    o.product?.title || "Product Deleted",
      productImage:    o.product?.images?.[0]?.url || null,
      buyerId:         o.buyerId,
      buyerName:       o.buyer?.name  || "Unknown",
      sellerId:        o.sellerId,
      sellerName:      o.seller?.name || "Unknown",
      totalAmount:     parseFloat(o.amount),
      status:          o.status,
      paymentMethod:   o.paymentMethod,
      deliveryAddress: o.deliveryAddress,
      createdAt:       o.createdAt,
      updatedAt:       o.updatedAt,
    }));

    return ok(res, data);
  } catch (e) { return serverError(res, e, "getAllOrders"); }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return ok(res, categories);
  } catch (e) { return serverError(res, e, "getCategories"); }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return fail(res, "Name is required");

    const slug = slugify(name);
    const category = await prisma.category.create({
      data: { name, slug, icon: icon || null, description: description || null },
    });
    return ok(res, category, "Category created");
  } catch (e) { return serverError(res, e, "createCategory"); }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const data = {};
    if (name        !== undefined) { data.name = name; data.slug = slugify(name); }
    if (icon        !== undefined) data.icon        = icon        || null;
    if (description !== undefined) data.description = description || null;

    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    return ok(res, category, "Category updated");
  } catch (e) { return serverError(res, e, "updateCategory"); }
};

exports.deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    return ok(res, null, "Category deleted");
  } catch (e) { return serverError(res, e, "deleteCategory"); }
};
