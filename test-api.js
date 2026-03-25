// Test API endpoints
// Run: node test-api.js

const BASE_URL = "http://localhost:5000/api";
let authToken = "";
let userId = "";
let productId = "";

async function testAPI(method, endpoint, data = null, useAuth = false) {
  const headers = { "Content-Type": "application/json" };
  if (useAuth && authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    console.log(`\n${method} ${endpoint}:`, response.status);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log("🧪 Starting API Tests...\n");

  // 1. Test Signup
  console.log("\n=== 1. SIGNUP ===");
  const signupData = {
    name: "Test Seller",
    email: `seller${Date.now()}@test.com`,
    password: "password123",
    phone: "0712345678",
    role: "seller",
    location: "Nairobi",
  };
  const signupResult = await testAPI("POST", "/auth/signup", signupData);
  if (signupResult?.success) {
    authToken = signupResult.data.token;
    userId = signupResult.data.user.id;
  }

  // 2. Test Login
  console.log("\n=== 2. LOGIN ===");
  const loginResult = await testAPI("POST", "/auth/login", {
    email: signupData.email,
    password: signupData.password,
  });

  // 3. Test Get Me
  console.log("\n=== 3. GET ME ===");
  await testAPI("GET", "/auth/me", null, true);

  // 4. Test Get Categories
  console.log("\n=== 4. GET CATEGORIES ===");
  await testAPI("GET", "/categories");

  // 5. Test Create Category (Admin only - will fail)
  console.log("\n=== 5. CREATE CATEGORY (Should fail - not admin) ===");
  await testAPI("POST", "/categories", { name: "Test Category", slug: "test-category" }, true);

  // 6. Test Create Product
  console.log("\n=== 6. CREATE PRODUCT ===");
  const productData = {
    title: "Test iPhone 15",
    slug: "test-iphone-15",
    description: "Brand new iPhone 15 for testing",
    price: 120000,
    location: "Nairobi",
    condition: "new",
    images: [{ url: "https://example.com/image.jpg", alt: "iPhone" }],
  };
  const productResult = await testAPI("POST", "/products", productData, true);
  if (productResult?.success) {
    productId = productResult.data.id;
  }

  // 7. Test Get Products
  console.log("\n=== 7. GET PRODUCTS ===");
  await testAPI("GET", "/products?page=1&pageSize=5");

  // 8. Test Get Single Product
  if (productId) {
    console.log("\n=== 8. GET SINGLE PRODUCT ===");
    await testAPI("GET", `/products/${productId}`);
  }

  // 9. Test Update Product
  if (productId) {
    console.log("\n=== 9. UPDATE PRODUCT ===");
    await testAPI("PUT", `/products/${productId}`, {
      title: "Updated iPhone 15 Pro",
      description: "Updated description",
      price: 125000,
      status: "active",
      condition: "new",
    }, true);
  }

  // 10. Test Search Products
  console.log("\n=== 10. SEARCH PRODUCTS ===");
  await testAPI("GET", "/products?search=iphone");

  // 11. Test Filter by Price
  console.log("\n=== 11. FILTER BY PRICE ===");
  await testAPI("GET", "/products?minPrice=100000&maxPrice=150000");

  console.log("\n\n✅ All tests completed!");
}

runTests();
