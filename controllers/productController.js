const prisma = require("../lib/prisma");
const { ok, created, fail, notFound, forbidden, serverError, parsePagination, paginated, slugify, compact } = require("../utils");

exports.getProducts = async (req, res) => {
  try {
    const { categoryId, search, condition, status, minPrice, maxPrice, sortBy, featured } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);

    const where = {
      status: status || "active",
      ...(categoryId && { categoryId }),
      ...(condition  && { condition }),
      ...(featured === "true" && { featured: true }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      }),
      ...(search && {
        OR: [
          { title:       { contains: search } },
          { description: { contains: search } },
          { seller:      { name: { contains: search } } },
        ],
      }),
    };

    const orderBy =
      sortBy === "price_asc"  ? { price: "asc" }      :
      sortBy === "price_desc" ? { price: "desc" }     :
      sortBy === "popular"    ? { views: "desc" }     :
                                { createdAt: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where, orderBy, skip, take,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          seller:   { select: { id: true, name: true, isVerified: true, phone: true } },
          images:   { orderBy: { displayOrder: "asc" } },
        },
      }),
    ]);

    return paginated(res, products, total, page, pageSize);
  } catch (e) { return serverError(res, e, "getProducts"); }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller:   { select: { id: true, name: true, isVerified: true, phone: true, location: true } },
        images:   { orderBy: { displayOrder: "asc" } },
      },
    });
    if (!product) return notFound(res, "Product not found");

    await prisma.product.update({ where: { id: product.id }, data: { views: { increment: 1 } } });
    return ok(res, product);
  } catch (e) { return serverError(res, e, "getProduct"); }
};

exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, categoryId, location, condition, stock } = req.body;
    if (!title || !price) return fail(res, "Title and price are required");

    const slug = slugify(title) + "-" + Date.now();

    const product = await prisma.product.create({
      data: {
        title, slug,
        description: description || null,
        price:       parseFloat(price),
        stock:       parseInt(stock, 10) || 1,
        categoryId:  categoryId || null,
        sellerId:    req.user.id,
        location:    location  || null,
        condition:   condition || "new",
        status:      "active",
      },
    });

    if (req.files?.length) {
      await prisma.productImage.createMany({
        data: req.files.map((f, i) => ({
          productId:    product.id,
          url:          `/uploads/${f.filename}`,
          alt:          title,
          displayOrder: i,
        })),
      });
    }

    const full = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });

    return created(res, full, "Product created");
  } catch (e) { return serverError(res, e, "createProduct"); }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return notFound(res, "Product not found");
    if (product.sellerId !== req.user.id && req.user.role !== "admin")
      return forbidden(res);

    const { title, description, price, categoryId, location, condition, status, featured } = req.body;

    const data = compact({
      title,
      description: description ?? undefined,
      price:       price       !== undefined ? parseFloat(price) : undefined,
      categoryId:  categoryId  ?? undefined,
      location:    location    ?? undefined,
      condition:   condition   ?? undefined,
      status:      status && (req.user.role === "admin" || ["active","inactive"].includes(status))
                     ? status : undefined,
      featured:    featured !== undefined && req.user.role === "admin"
                     ? Boolean(featured) : undefined,
    });

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { images: { orderBy: { displayOrder: "asc" } } },
    });

    return ok(res, updated, "Product updated");
  } catch (e) { return serverError(res, e, "updateProduct"); }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return notFound(res, "Product not found");
    if (product.sellerId !== req.user.id && req.user.role !== "admin")
      return forbidden(res);

    await prisma.product.delete({ where: { id: req.params.id } });
    return ok(res, null, "Product deleted");
  } catch (e) { return serverError(res, e, "deleteProduct"); }
};
