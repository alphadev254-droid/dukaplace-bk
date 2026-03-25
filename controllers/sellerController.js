const prisma = require("../lib/prisma");
const { ok, serverError, parsePagination, paginated } = require("../utils");

exports.getMyProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);

    const where = {
      sellerId: req.user.id,
      ...(status && { status }),
    };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images:   { orderBy: { displayOrder: "asc" } },
        },
      }),
    ]);

    return paginated(res, products, total, page, pageSize);
  } catch (e) { return serverError(res, e, "getMyProducts"); }
};
