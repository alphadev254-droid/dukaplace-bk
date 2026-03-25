@echo off
echo ========================================
echo Testing Dukaplace Backend APIs
echo ========================================

echo.
echo 1. Testing Root Endpoint...
curl -X GET http://localhost:5000/

echo.
echo.
echo 2. Testing Signup...
curl -X POST http://localhost:5000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Seller\",\"email\":\"seller%RANDOM%@test.com\",\"password\":\"password123\",\"phone\":\"0712345678\",\"role\":\"seller\",\"location\":\"Nairobi\"}" ^
  -o signup-response.json

echo.
echo Signup response saved to signup-response.json

echo.
echo.
echo 3. Testing Login...
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"seller@test.com\",\"password\":\"password123\"}" ^
  -o login-response.json

echo.
echo Login response saved to login-response.json

echo.
echo.
echo 4. Testing Get Categories...
curl -X GET http://localhost:5000/api/categories

echo.
echo.
echo 5. Testing Get Products...
curl -X GET "http://localhost:5000/api/products?page=1&pageSize=5"

echo.
echo.
echo ========================================
echo Tests Complete!
echo ========================================
echo.
echo To test authenticated endpoints:
echo 1. Check login-response.json for token
echo 2. Use: curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/auth/me
echo.
pause
