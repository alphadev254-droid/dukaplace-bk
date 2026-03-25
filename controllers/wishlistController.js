const prisma = require("../lib/prisma");
const { ok, fail, serverError } = require("../utils");

exports.getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { images: { take: 1, orderBy: { displayOrder: "asc" } } },
        },
      },
    });
    return ok(res, items.map((w) => ({ ...w.product, wishlistId: w.id })));
  } catch (e) { return serverError(res, e, "getWishlist"); }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const existing = await prisma.wishlist.findFirst({
      where: { userId: req.user.id, productId },
    });
    if (existing) return fail(res, "Already in wishlist");

    await prisma.wishlist.create({ data: { userId: req.user.id, productId } });
    return ok(res, null, "Added to wishlist");
  } catch (e) { return serverError(res, e, "addToWishlist"); }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId },
    });
    return ok(res, null, "Removed from wishlist");
  } catch (e) { return serverError(res, e, "removeFromWishlist"); }
};
