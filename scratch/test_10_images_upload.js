/**
 * Test: 10-Angle Multi-Image Upload & Product Display Test
 */

const test10Images = async () => {
  const base = 'http://localhost:8080/api';

  console.log('=====================================================');
  console.log('📸 TESTING 10-IMAGE UPLOAD & MULTI-ANGLE GALLERY');
  console.log('=====================================================\n');

  // 1. Admin Login
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@lapkart.com', password: 'Admin@123' })
  });
  const { token } = await loginRes.json();
  console.log('✓ Admin authenticated successfully.');

  // 2. Define 10 realistic angle photos
  const tenAngles = [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80", // 1. Front Display
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80", // 2. Back Lid Cover
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80", // 3. Top-Down Keyboard
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80", // 4. Left Side Ports
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80", // 5. Right Side Profile
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80", // 6. RGB Gaming View
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80", // 7. Screen & Bezel
    "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?auto=format&fit=crop&w=800&q=80", // 8. Ultra-Slim Profile
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80", // 9. High-FPS Dual Vent
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"  // 10. In-Box & Accessories
  ];

  // 3. Create a Laptop with 10 Angle Images
  const createRes = await fetch(`${base}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Apple MacBook Pro 16 M3 Max (10-Angle Showcase Edition)",
      brand: "Apple",
      category: "Ultrabook",
      image: tenAngles[0], // primary thumbnail
      images: tenAngles,   // 10 full angle gallery
      processor: "Apple M3 Max (16-Core CPU, 40-Core GPU)",
      ram: "64GB Unified Memory",
      storage: "2TB NVMe PCIe SSD",
      graphics: "Integrated 40-Core GPU",
      display: "16.2-inch Liquid Retina XDR (3456x2234) 120Hz ProMotion",
      os: "macOS Sonoma",
      mrp: 349900,
      price: 319900,
      stock: 7,
      inStock: true,
      status: "approved"
    })
  });

  const createData = await createRes.json();
  console.log(`✓ Created Laptop with 10 Angles -> Status ${createRes.status}: "${createData.product.name}" (ID: ${createData.product.id})`);
  console.log(`  Total Gallery Images attached: ${createData.product.images.length}`);

  // 4. Fetch the created product via Public Store API
  const getRes = await fetch(`${base}/products/${createData.product.id}`);
  const getData = await getRes.json();
  console.log(`\n✓ Public GET /api/products/${createData.product.id} returned:`);
  console.log(`  Product Name: ${getData.product.name}`);
  console.log(`  Primary Image: ${getData.product.image.slice(0, 60)}...`);
  console.log(`  Gallery Count: ${getData.product.images.length} images`);
  getData.product.images.forEach((img, i) => {
    console.log(`    Angle #${i + 1}: ${img.slice(0, 65)}...`);
  });

  if (getData.product.images.length !== 10) {
    throw new Error(`Expected 10 images, got ${getData.product.images.length}`);
  }

  console.log('\n=====================================================');
  console.log('🎉 10-IMAGE UPLOAD & GALLERY VERIFICATION PASSED 100%!');
  console.log('=====================================================\n');
};

test10Images().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
