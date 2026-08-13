# বাংলাদেশ ডাক বিভাগ — পোস্টম্যান ফিল্ড অ্যাপ

মোবাইলবান্ধব React অ্যাপ, যার মাধ্যমে ডাকপিয়ন বর্তমান GPS অবস্থান ব্যবহার করে ডেলিভারি ঠিকানা চিহ্নিত করতে পারেন।

## চালু করা

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

`main` branch-এ push হলে GitHub Actions স্বয়ংক্রিয়ভাবে GitHub Pages-এ deploy করবে।

## PWA ইনস্টল

GitHub Pages-এর HTTPS ঠিকানাটি Chrome/Edge-এ খুলে **Install app** বা **Add to Home screen** নির্বাচন করুন। ইনস্টল করার পর অ্যাপটি আলাদা standalone window-তে চালু হবে এবং আগে লোড হওয়া app assets offline-এ পাওয়া যাবে। নতুন map tile ও GPS map data-এর জন্য ইন্টারনেট সংযোগ প্রয়োজন হতে পারে।
