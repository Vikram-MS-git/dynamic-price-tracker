import * as productModel from '../models/productModel.js';
import * as groupModel from '../models/groupModel.js';
import * as alertModel from '../models/alertModel.js';

/**
 * Curated PC Components Catalog with realistic Indian retail prices (Amazon.in & Flipkart.com),
 * power consumption ratings (TDP / Wattage), and hardware socket/memory specifications.
 */
export const COMPONENT_CATALOG = {
  cpu: [
    {
      id: 'cpu-r5-5600',
      category: 'cpu',
      brand: 'AMD',
      name: 'AMD Ryzen 5 5600 Desktop Processor',
      specs: '6 Cores, 12 Threads, Up to 4.4 GHz, 35MB Cache',
      socket: 'AM4',
      ramType: 'DDR4',
      tdp: 65,
      priceAmazon: 11499,
      priceFlipkart: 11899,
      image: 'https://m.media-amazon.com/images/I/51r26kYwH8L._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09VCHR1VH',
      urlFlipkart: 'https://www.flipkart.com/amd-ryzen-5-5600-3-5-ghz-upto-4-4-ghz-am4-socket-6-cores-12-threads-desktop-processor/p/itme9ff6ce7076a5',
    },
    {
      id: 'cpu-r5-7600',
      category: 'cpu',
      brand: 'AMD',
      name: 'AMD Ryzen 5 7600 Desktop Processor',
      specs: '6 Cores, 12 Threads, Up to 5.1 GHz, Radeon Graphics',
      socket: 'AM5',
      ramType: 'DDR5',
      tdp: 65,
      priceAmazon: 17999,
      priceFlipkart: 18499,
      image: 'https://m.media-amazon.com/images/I/51G8-M+b5rL._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BMQJWBDQ',
      urlFlipkart: 'https://www.flipkart.com/amd-ryzen-5-7600-3-8-ghz-upto-5-1-ghz-am5-socket-6-cores-12-threads-desktop-processor/p/itm534720973a119',
    },
    {
      id: 'cpu-r7-7800x3d',
      category: 'cpu',
      brand: 'AMD',
      name: 'AMD Ryzen 7 7800X3D Desktop Gaming Processor',
      specs: '8 Cores, 16 Threads, Up to 5.0 GHz, 3D V-Cache (Gaming King)',
      socket: 'AM5',
      ramType: 'DDR5',
      tdp: 120,
      priceAmazon: 38999,
      priceFlipkart: 39499,
      image: 'https://m.media-amazon.com/images/I/51n2xI815LL._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BTZB7F88',
      urlFlipkart: 'https://www.flipkart.com/amd-ryzen-7-7800x3d-4-2-ghz-upto-5-ghz-am5-socket-8-cores-16-threads-desktop-processor/p/itmdbb31f7cf655e',
    },
    {
      id: 'cpu-i3-12100f',
      category: 'cpu',
      brand: 'Intel',
      name: 'Intel Core i3-12100F 12th Gen Processor',
      specs: '4 Cores, 8 Threads, Up to 4.3 GHz, Budget Champion',
      socket: 'LGA1700',
      ramType: 'DDR4',
      tdp: 58,
      priceAmazon: 7499,
      priceFlipkart: 7699,
      image: 'https://m.media-amazon.com/images/I/51L8q2N94wL._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09NPJX7PV',
      urlFlipkart: 'https://www.flipkart.com/intel-core-i3-12100f-12th-gen-lga1700-desktop-processor/p/itm8787889123456',
    },
    {
      id: 'cpu-i5-12400f',
      category: 'cpu',
      brand: 'Intel',
      name: 'Intel Core i5-12400F 12th Gen Processor',
      specs: '6 Cores, 12 Threads, Up to 4.4 GHz, 18MB Cache',
      socket: 'LGA1700',
      ramType: 'DDR4',
      tdp: 65,
      priceAmazon: 10299,
      priceFlipkart: 10599,
      image: 'https://m.media-amazon.com/images/I/51Oa-Z4xLTL._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09MDFH5HY',
      urlFlipkart: 'https://www.flipkart.com/intel-core-i5-12400f-12th-gen-lga1700-desktop-processor/p/itm9374092173456',
    },
    {
      id: 'cpu-i5-13600k',
      category: 'cpu',
      brand: 'Intel',
      name: 'Intel Core i5-13600K 13th Gen Processor',
      specs: '14 Cores (6P + 8E), 20 Threads, Up to 5.1 GHz',
      socket: 'LGA1700',
      ramType: 'DDR5',
      tdp: 125,
      priceAmazon: 26999,
      priceFlipkart: 27499,
      image: 'https://m.media-amazon.com/images/I/51TzB9F5Y7L._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BCDR9M33',
      urlFlipkart: 'https://www.flipkart.com/intel-core-i5-13600k-13th-gen-desktop-processor/p/itmd190348719234',
    },
    {
      id: 'cpu-i7-14700k',
      category: 'cpu',
      brand: 'Intel',
      name: 'Intel Core i7-14700K 14th Gen Processor',
      specs: '20 Cores (8P + 12E), 28 Threads, Up to 5.6 GHz Workstation Monster',
      socket: 'LGA1700',
      ramType: 'DDR5',
      tdp: 125,
      priceAmazon: 37999,
      priceFlipkart: 38499,
      image: 'https://m.media-amazon.com/images/I/51a37oZ948L._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CGJ41K8J',
      urlFlipkart: 'https://www.flipkart.com/intel-core-i7-14700k-14th-gen-desktop-processor/p/itmfc18923471923',
    },
  ],

  motherboard: [
    {
      id: 'mobo-b450m-pro',
      category: 'motherboard',
      brand: 'MSI',
      name: 'MSI B450M PRO-VDH MAX Motherboard',
      specs: 'Socket AM4, DDR4 Support, PCIe 3.0 M.2, mATX',
      socket: 'AM4',
      ramType: 'DDR4',
      formFactor: 'Micro-ATX',
      priceAmazon: 5499,
      priceFlipkart: 5699,
      image: 'https://m.media-amazon.com/images/I/81xUeK941fL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B07WC724Z7',
      urlFlipkart: 'https://www.flipkart.com/msi-b450m-pro-vdh-max-motherboard/p/itmfa21345678901',
    },
    {
      id: 'mobo-b550m-ds3h',
      category: 'motherboard',
      brand: 'Gigabyte',
      name: 'Gigabyte B550M DS3H AC Motherboard',
      specs: 'Socket AM4, DDR4, Dual M.2 PCIe 4.0, Built-in WiFi + Bluetooth, mATX',
      socket: 'AM4',
      ramType: 'DDR4',
      formFactor: 'Micro-ATX',
      priceAmazon: 8499,
      priceFlipkart: 8799,
      image: 'https://m.media-amazon.com/images/I/81dG2Z5p1YL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B089FY7QT1',
      urlFlipkart: 'https://www.flipkart.com/gigabyte-b550m-ds3h-ac-motherboard/p/itmb550mac123456',
    },
    {
      id: 'mobo-b650m-pro',
      category: 'motherboard',
      brand: 'MSI',
      name: 'MSI PRO B650M-A WiFi Motherboard',
      specs: 'Socket AM5, DDR5 Support, PCIe 4.0, WiFi 6E + 2.5G LAN, mATX',
      socket: 'AM5',
      ramType: 'DDR5',
      formFactor: 'Micro-ATX',
      priceAmazon: 14299,
      priceFlipkart: 14599,
      image: 'https://m.media-amazon.com/images/I/71u9Q5R70SL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BHCKB2W7',
      urlFlipkart: 'https://www.flipkart.com/msi-pro-b650m-a-wifi-motherboard/p/itmb650m12345678',
    },
    {
      id: 'mobo-b650-tuf',
      category: 'motherboard',
      brand: 'ASUS',
      name: 'ASUS TUF Gaming B650-PLUS WiFi Motherboard',
      specs: 'Socket AM5, DDR5, PCIe 5.0 M.2, Heavy VRM Heatsinks, ATX',
      socket: 'AM5',
      ramType: 'DDR5',
      formFactor: 'ATX',
      priceAmazon: 20499,
      priceFlipkart: 20999,
      image: 'https://m.media-amazon.com/images/I/71M0d31uEKL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BH911DNP',
      urlFlipkart: 'https://www.flipkart.com/asus-tuf-gaming-b650-plus-wifi-motherboard/p/itmtufb65012345',
    },
    {
      id: 'mobo-h610m-ddr4',
      category: 'motherboard',
      brand: 'MSI',
      name: 'MSI PRO H610M-E DDR4 Motherboard',
      specs: 'Socket LGA1700, DDR4 Support, PCIe 4.0 x16, mATX Budget',
      socket: 'LGA1700',
      ramType: 'DDR4',
      formFactor: 'Micro-ATX',
      priceAmazon: 5899,
      priceFlipkart: 6099,
      image: 'https://m.media-amazon.com/images/I/71-E3x4qQML._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09P8K1V3H',
      urlFlipkart: 'https://www.flipkart.com/msi-pro-h610m-e-ddr4-motherboard/p/itmh610m12345678',
    },
    {
      id: 'mobo-b760m-ddr5',
      category: 'motherboard',
      brand: 'ASRock',
      name: 'ASRock B760M PG Lightning DDR5 Motherboard',
      specs: 'Socket LGA1700, DDR5 Support, Dual Hyper M.2 PCIe 4.0, mATX',
      socket: 'LGA1700',
      ramType: 'DDR5',
      formFactor: 'Micro-ATX',
      priceAmazon: 11499,
      priceFlipkart: 11799,
      image: 'https://m.media-amazon.com/images/I/71BvY8uL7BL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BR8C694F',
      urlFlipkart: 'https://www.flipkart.com/asrock-b760m-pg-lightning-motherboard/p/itmb760m12345678',
    },
    {
      id: 'mobo-b760-tomahawk',
      category: 'motherboard',
      brand: 'MSI',
      name: 'MSI MAG B760 TOMAHAWK WIFI DDR5 Motherboard',
      specs: 'Socket LGA1700, DDR5 7000+ MHz OC, 3x M.2 PCIe 4.0, WiFi 6E, ATX',
      socket: 'LGA1700',
      ramType: 'DDR5',
      formFactor: 'ATX',
      priceAmazon: 19999,
      priceFlipkart: 20499,
      image: 'https://m.media-amazon.com/images/I/71R2Hn6P7XL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BPX9LL93',
      urlFlipkart: 'https://www.flipkart.com/msi-mag-b760-tomahawk-wifi-ddr5-motherboard/p/itmtomahawk12345',
    },
  ],

  gpu: [
    {
      id: 'gpu-none',
      category: 'gpu',
      brand: 'Integrated',
      name: 'Integrated CPU Graphics (No Dedicated GPU)',
      specs: 'Standard display output for basic desktop and office use',
      tdp: 0,
      priceAmazon: 0,
      priceFlipkart: 0,
      image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&auto=format&fit=crop&q=60',
      urlAmazon: '',
      urlFlipkart: '',
    },
    {
      id: 'gpu-rx-6600',
      category: 'gpu',
      brand: 'AMD',
      name: 'AMD Radeon RX 6600 8GB GDDR6',
      specs: '8GB GDDR6, 1080p High Gaming Champion, PCIe 4.0',
      tdp: 132,
      priceAmazon: 19499,
      priceFlipkart: 19999,
      image: 'https://m.media-amazon.com/images/I/81fH+1L63OL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09HHLX543',
      urlFlipkart: 'https://www.flipkart.com/asrock-amd-radeon-rx-6600-challenger-d-8gb-graphics-card/p/itmrx6600123456',
    },
    {
      id: 'gpu-rtx-3050',
      category: 'gpu',
      brand: 'NVIDIA',
      name: 'NVIDIA GeForce RTX 3050 6GB GDDR6',
      specs: '6GB GDDR6, Ray Tracing & DLSS Support, Low Power',
      tdp: 70,
      priceAmazon: 16499,
      priceFlipkart: 16999,
      image: 'https://m.media-amazon.com/images/I/71u9iVf9rRL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CV5V5V6M',
      urlFlipkart: 'https://www.flipkart.com/msi-geforce-rtx-3050-ventus-2x-6g-graphics-card/p/itmrtx30506g1234',
    },
    {
      id: 'gpu-rtx-4060',
      category: 'gpu',
      brand: 'NVIDIA',
      name: 'NVIDIA GeForce RTX 4060 8GB GDDR6',
      specs: '8GB GDDR6, DLSS 3 Frame Generation, 1080p Ultra / 1440p Entry',
      tdp: 115,
      priceAmazon: 28499,
      priceFlipkart: 28999,
      image: 'https://m.media-amazon.com/images/I/71bZ4Q285OL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0C8JZ7VT9',
      urlFlipkart: 'https://www.flipkart.com/zotac-gaming-geforce-rtx-4060-8gb-twin-edge-graphics-card/p/itmrtx40608g1234',
    },
    {
      id: 'gpu-rx-7600xt',
      category: 'gpu',
      brand: 'AMD',
      name: 'AMD Radeon RX 7600 XT 16GB GDDR6',
      specs: '16GB VRAM for high textures, FSR 3, 1080p Ultra & 1440p Gaming',
      tdp: 190,
      priceAmazon: 31999,
      priceFlipkart: 32499,
      image: 'https://m.media-amazon.com/images/I/81eQkF94-qL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CS9Q84G5',
      urlFlipkart: 'https://www.flipkart.com/powercolor-fighter-amd-radeon-rx-7600-xt-16gb-graphics-card/p/itmrx7600xt16g12',
    },
    {
      id: 'gpu-rtx-4060ti',
      category: 'gpu',
      brand: 'NVIDIA',
      name: 'NVIDIA GeForce RTX 4060 Ti 8GB GDDR6',
      specs: '8GB GDDR6, DLSS 3, High FPS 1080p / 1440p Esports',
      tdp: 160,
      priceAmazon: 36999,
      priceFlipkart: 37499,
      image: 'https://m.media-amazon.com/images/I/71n5uR3j7oL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0C5R96X6D',
      urlFlipkart: 'https://www.flipkart.com/gigabyte-geforce-rtx-4060-ti-windforce-8gb-graphics-card/p/itmrtx4060ti1234',
    },
    {
      id: 'gpu-rx-7800xt',
      category: 'gpu',
      brand: 'AMD',
      name: 'AMD Radeon RX 7800 XT 16GB GDDR6',
      specs: '16GB VRAM, 1440p Native Sweet Spot, RDNA 3 Architecture',
      tdp: 263,
      priceAmazon: 51999,
      priceFlipkart: 52499,
      image: 'https://m.media-amazon.com/images/I/81hU4oB+P+L._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CGMDG45Z',
      urlFlipkart: 'https://www.flipkart.com/sapphire-pulse-amd-radeon-rx-7800-xt-16gb-graphics-card/p/itmrx7800xt16gb1',
    },
    {
      id: 'gpu-rtx-4070super',
      category: 'gpu',
      brand: 'NVIDIA',
      name: 'NVIDIA GeForce RTX 4070 Super 12GB GDDR6X',
      specs: '12GB GDDR6X, DLSS 3.5, 1440p Max & 4K Ray Tracing Beast',
      tdp: 220,
      priceAmazon: 59999,
      priceFlipkart: 60499,
      image: 'https://m.media-amazon.com/images/I/71i7Y1o-8VL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CSBD49P7',
      urlFlipkart: 'https://www.flipkart.com/zotac-gaming-geforce-rtx-4070-super-twin-edge-12gb-graphics-card/p/itmrtx4070s12345',
    },
    {
      id: 'gpu-rtx-4080super',
      category: 'gpu',
      brand: 'NVIDIA',
      name: 'NVIDIA GeForce RTX 4080 Super 16GB GDDR6X',
      specs: '16GB GDDR6X, Flagship 4K Ultra 120+ FPS Gaming & AI Workstation',
      tdp: 320,
      priceAmazon: 99999,
      priceFlipkart: 101499,
      image: 'https://m.media-amazon.com/images/I/71xS8bL1H8L._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CT1H5873',
      urlFlipkart: 'https://www.flipkart.com/msi-geforce-rtx-4080-super-16g-ventus-3x-graphics-card/p/itmrtx4080s12345',
    },
  ],

  ram: [
    {
      id: 'ram-ddr4-16gb',
      category: 'ram',
      brand: 'Corsair',
      name: 'Corsair Vengeance LPX 16GB (1x16GB) DDR4 3200MHz',
      specs: '16GB DDR4, 3200MHz, CL16, Aluminum Heat Spreader',
      ramType: 'DDR4',
      priceAmazon: 2999,
      priceFlipkart: 3199,
      image: 'https://m.media-amazon.com/images/I/51w7lE9lFKL._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B07WJJHWYD',
      urlFlipkart: 'https://www.flipkart.com/corsair-vengeance-lpx-ddr4-16gb-3200mhz-ram/p/itmramddr416gb1',
    },
    {
      id: 'ram-ddr4-32gb',
      category: 'ram',
      brand: 'Corsair',
      name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4 3200MHz Kit',
      specs: '32GB Dual Channel (2x16GB), 3200MHz, CL16',
      ramType: 'DDR4',
      priceAmazon: 5799,
      priceFlipkart: 5999,
      image: 'https://m.media-amazon.com/images/I/51Tq5E9lFKL._SL1000_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B07RW6Z692',
      urlFlipkart: 'https://www.flipkart.com/corsair-vengeance-lpx-32gb-2x16gb-ddr4-ram/p/itmramddr432gb1',
    },
    {
      id: 'ram-ddr5-16gb',
      category: 'ram',
      brand: 'Crucial',
      name: 'Crucial Pro 16GB (1x16GB) DDR5 5600MHz',
      specs: '16GB DDR5, 5600MHz, Intel XMP 3.0 & AMD EXPO Compatible',
      ramType: 'DDR5',
      priceAmazon: 4199,
      priceFlipkart: 4399,
      image: 'https://m.media-amazon.com/images/I/61N+V3q9+rL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0C34737G5',
      urlFlipkart: 'https://www.flipkart.com/crucial-pro-16gb-ddr5-5600mhz-desktop-ram/p/itmramddr516gb1',
    },
    {
      id: 'ram-ddr5-32gb',
      category: 'ram',
      brand: 'G.Skill',
      name: 'G.Skill Ripjaws S5 32GB (2x16GB) DDR5 6000MHz Kit',
      specs: '32GB Dual Channel, 6000MHz CL36, Optimal Ryzen 7000 & Intel 14th Gen',
      ramType: 'DDR5',
      priceAmazon: 9499,
      priceFlipkart: 9799,
      image: 'https://m.media-amazon.com/images/I/61sV6xG6hQL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09Y16CDLG',
      urlFlipkart: 'https://www.flipkart.com/g-skill-ripjaws-s5-32gb-2x16gb-ddr5-6000mhz-ram/p/itmramddr532gb2',
    },
    {
      id: 'ram-ddr5-64gb',
      category: 'ram',
      brand: 'Corsair',
      name: 'Corsair Vengeance RGB 64GB (2x32GB) DDR5 6000MHz Kit',
      specs: '64GB Dual Channel (2x32GB), 6000MHz CL30, For 4K Video & Deep Learning',
      ramType: 'DDR5',
      priceAmazon: 19499,
      priceFlipkart: 19999,
      image: 'https://m.media-amazon.com/images/I/61z+O6L9wZL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0C5M796F4',
      urlFlipkart: 'https://www.flipkart.com/corsair-vengeance-rgb-64gb-2x32gb-ddr5-ram/p/itmramddr564gb1',
    },
  ],

  storage: [
    {
      id: 'ssd-500gb',
      category: 'storage',
      brand: 'Crucial',
      name: 'Crucial P3 500GB PCIe 3.0 3D NAND NVMe M.2 SSD',
      specs: '500GB, Speeds up to 3500MB/s Read, M.2 2280',
      priceAmazon: 2999,
      priceFlipkart: 3099,
      image: 'https://m.media-amazon.com/images/I/61l15HkR8XL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0B25L3P3T',
      urlFlipkart: 'https://www.flipkart.com/crucial-p3-500gb-nvme-m-2-internal-solid-state-drive/p/itmssd500gb1234',
    },
    {
      id: 'ssd-1tb-nv2',
      category: 'storage',
      brand: 'Kingston',
      name: 'Kingston NV2 1TB M.2 2280 PCIe 4.0 NVMe SSD',
      specs: '1TB, Speeds up to 3500MB/s Read, PCIe Gen 4x4',
      priceAmazon: 5199,
      priceFlipkart: 5399,
      image: 'https://m.media-amazon.com/images/I/71D0Y7tO7qL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BBWH1R8H',
      urlFlipkart: 'https://www.flipkart.com/kingston-nv2-1tb-m-2-2280-pcie-4-0-nvme-ssd/p/itmssd1tbkingston',
    },
    {
      id: 'ssd-1tb-sn770',
      category: 'storage',
      brand: 'Western Digital',
      name: 'WD Black SN770 1TB PCIe Gen4 NVMe M.2 Gaming SSD',
      specs: '1TB, Speeds up to 5150MB/s Read, DRAM-less with HMB',
      priceAmazon: 6499,
      priceFlipkart: 6699,
      image: 'https://m.media-amazon.com/images/I/61b7Ue8O9vL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09QV692XY',
      urlFlipkart: 'https://www.flipkart.com/western-digital-wd-black-sn770-1tb-nvme-m-2-ssd/p/itmssdwdblack1tb',
    },
    {
      id: 'ssd-2tb-p3plus',
      category: 'storage',
      brand: 'Crucial',
      name: 'Crucial P3 Plus 2TB PCIe 4.0 3D NAND NVMe M.2 SSD',
      specs: '2TB, Speeds up to 5000MB/s Read, High Capacity for Games & Media',
      priceAmazon: 10499,
      priceFlipkart: 10799,
      image: 'https://m.media-amazon.com/images/I/614H8ZfR4uL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0B25ML2FH',
      urlFlipkart: 'https://www.flipkart.com/crucial-p3-plus-2tb-nvme-m-2-internal-solid-state-drive/p/itmssd2tbcrucial',
    },
  ],

  psu: [
    {
      id: 'psu-550w',
      category: 'psu',
      brand: 'Deepcool',
      name: 'Deepcool PK550D 550W 80 Plus Bronze Power Supply',
      specs: '550W, 80 PLUS Bronze Certified, Flat Black Cables, 120mm Silent Fan',
      wattage: 550,
      priceAmazon: 3499,
      priceFlipkart: 3599,
      image: 'https://m.media-amazon.com/images/I/61rU1sJ+QzL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09Q2K19N8',
      urlFlipkart: 'https://www.flipkart.com/deepcool-pk550d-550w-80-plus-bronze-power-supply/p/itmpsu550w12345',
    },
    {
      id: 'psu-650w',
      category: 'psu',
      brand: 'Corsair',
      name: 'Corsair CV650 650W 80 Plus Bronze Power Supply',
      specs: '650W, 80 PLUS Bronze, Low-Noise 120mm Fan, Compact Casing',
      wattage: 650,
      priceAmazon: 4699,
      priceFlipkart: 4899,
      image: 'https://m.media-amazon.com/images/I/71u9s8X60oL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B07YVWW7MW',
      urlFlipkart: 'https://www.flipkart.com/corsair-cv650-650w-80-plus-bronze-power-supply/p/itmpsu650w12345',
    },
    {
      id: 'psu-750w',
      category: 'psu',
      brand: 'Cooler Master',
      name: 'Cooler Master MWE 750 V2 750W 80 Plus Bronze',
      specs: '750W, 80 PLUS Bronze, DC-to-DC Circuitry, Flat Cables',
      wattage: 750,
      priceAmazon: 6299,
      priceFlipkart: 6499,
      image: 'https://m.media-amazon.com/images/I/71C7N1o-4YL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B08H5VG695',
      urlFlipkart: 'https://www.flipkart.com/cooler-master-mwe-750-v2-750w-bronze-power-supply/p/itmpsu750w12345',
    },
    {
      id: 'psu-750w-gold',
      category: 'psu',
      brand: 'Corsair',
      name: 'Corsair RM750e 750W 80 Plus Gold Fully Modular PSU',
      specs: '750W, 80 PLUS Gold Certified, ATX 3.0 & PCIe 5.0 Ready, Zero RPM Fan Mode',
      wattage: 750,
      priceAmazon: 8999,
      priceFlipkart: 9299,
      image: 'https://m.media-amazon.com/images/I/71-0Gv2+8eL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BYR1BXC6',
      urlFlipkart: 'https://www.flipkart.com/corsair-rm750e-750w-80-plus-gold-fully-modular-psu/p/itmpsu750wgold1',
    },
    {
      id: 'psu-850w-gold',
      category: 'psu',
      brand: 'Corsair',
      name: 'Corsair RM850x 850W 80 Plus Gold Fully Modular PSU',
      specs: '850W, 80 PLUS Gold, 100% Japanese Capacitors, Magnetic Levitation Fan',
      wattage: 850,
      priceAmazon: 11999,
      priceFlipkart: 12299,
      image: 'https://m.media-amazon.com/images/I/71b+E1Q+3vL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B08R5JPTMZ',
      urlFlipkart: 'https://www.flipkart.com/corsair-rm850x-850w-80-plus-gold-fully-modular-psu/p/itmpsu850wgold1',
    },
  ],

  case: [
    {
      id: 'case-ice100',
      category: 'case',
      brand: 'Ant Esports',
      name: 'Ant Esports ICE-100 Mid-Tower Gaming Cabinet',
      specs: 'Mesh Front Panel, 4x 120mm RGB Fans Pre-installed, Acrylic Side Panel, mATX/ATX',
      formFactor: 'ATX',
      priceAmazon: 2799,
      priceFlipkart: 2899,
      image: 'https://m.media-amazon.com/images/I/71o0X4p-4CL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B08W5B7HBG',
      urlFlipkart: 'https://www.flipkart.com/ant-esports-ice-100-mid-tower-gaming-cabinet/p/itmcaseice10012',
    },
    {
      id: 'case-cc560',
      category: 'case',
      brand: 'Deepcool',
      name: 'Deepcool CC560 V2 ARGB Mid-Tower Cabinet',
      specs: 'Tempered Glass Side Panel, 4x Pre-installed ARGB Fans, High Airflow Mesh, ATX',
      formFactor: 'ATX',
      priceAmazon: 4499,
      priceFlipkart: 4699,
      image: 'https://m.media-amazon.com/images/I/61b7U1a2G7L._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0CT1Q8L4B',
      urlFlipkart: 'https://www.flipkart.com/deepcool-cc560-v2-argb-mid-tower-case/p/itmcasecc560v21',
    },
    {
      id: 'case-h5flow',
      category: 'case',
      brand: 'NZXT',
      name: 'NZXT H5 Flow Compact ATX Mid-Tower PC Gaming Case',
      specs: 'Perforated Front & Top Panels, Dedicated GPU Fan, Clean Cable Management, ATX',
      formFactor: 'ATX',
      priceAmazon: 7499,
      priceFlipkart: 7699,
      image: 'https://m.media-amazon.com/images/I/71t6P3W06XL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0B6577D59',
      urlFlipkart: 'https://www.flipkart.com/nzxt-h5-flow-compact-atx-mid-tower-case/p/itmcaseh5flow123',
    },
    {
      id: 'case-lancool216',
      category: 'case',
      brand: 'Lian Li',
      name: 'Lian Li Lancool 216 RGB High Airflow Cabinet',
      specs: '2x 160mm ARGB Front Fans + 1x 140mm Rear Fan, Ultimate Thermals, Dual Modularity',
      formFactor: 'ATX',
      priceAmazon: 8999,
      priceFlipkart: 9299,
      image: 'https://m.media-amazon.com/images/I/71V2T-U4+sL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BN3SY5TG',
      urlFlipkart: 'https://www.flipkart.com/lian-li-lancool-216-rgb-mid-tower-cabinet/p/itmcaselancool21',
    },
  ],

  cooler: [
    {
      id: 'cooler-stock',
      category: 'cooler',
      brand: 'Included',
      name: 'Stock Box Cooler (Included with CPU)',
      specs: 'Standard factory cooler bundled inside AMD/Intel boxed CPUs, 0W extra',
      priceAmazon: 0,
      priceFlipkart: 0,
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=60',
      urlAmazon: '',
      urlFlipkart: '',
    },
    {
      id: 'cooler-ag400',
      category: 'cooler',
      brand: 'Deepcool',
      name: 'Deepcool AG400 ARGB Single Tower CPU Cooler',
      specs: '4 Direct-Touch Heatpipes, 120mm PWM Fan, TDP up to 220W',
      priceAmazon: 1899,
      priceFlipkart: 1999,
      image: 'https://m.media-amazon.com/images/I/61N+V3q9+rL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0B6FG6ZBW',
      urlFlipkart: 'https://www.flipkart.com/deepcool-ag400-argb-cpu-air-cooler/p/itmcoolerag40012',
    },
    {
      id: 'cooler-peerless',
      category: 'cooler',
      brand: 'Thermalright',
      name: 'Thermalright Peerless Assassin 120 SE Dual Tower Cooler',
      specs: '6 Heatpipes, Dual 120mm PWM Fans, High-end Air Cooling Beast',
      priceAmazon: 3499,
      priceFlipkart: 3699,
      image: 'https://m.media-amazon.com/images/I/71u+u3M5lEL._SL1500_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B09LGY38L4',
      urlFlipkart: 'https://www.flipkart.com/thermalright-peerless-assassin-120-se-cpu-cooler/p/itmcoolerpa120se',
    },
    {
      id: 'cooler-ls520',
      category: 'cooler',
      brand: 'Deepcool',
      name: 'Deepcool LS520 SE 240mm AIO Liquid CPU Cooler',
      specs: '240mm Radiator, Dual FC120 A-RGB Fans, 4th Gen High-Performance Pump',
      priceAmazon: 5999,
      priceFlipkart: 6199,
      image: 'https://m.media-amazon.com/images/I/61hZz1a+qEL._SL1200_.jpg',
      urlAmazon: 'https://www.amazon.in/dp/B0BM4N9HBP',
      urlFlipkart: 'https://www.flipkart.com/deepcool-ls520-se-240mm-liquid-cpu-cooler/p/itmcoolerls520se',
    },
  ],
};

/**
 * Checks hardware compatibility across chosen components.
 */
export function checkCompatibility(components = {}) {
  const issues = [];
  const warnings = [];

  const cpu = components.cpu;
  const mobo = components.motherboard;
  const ram = components.ram;
  const gpu = components.gpu;
  const psu = components.psu;
  const caseComp = components.case;

  // 1. CPU vs Motherboard Socket
  if (cpu && mobo) {
    if (cpu.socket && mobo.socket && cpu.socket !== mobo.socket) {
      issues.push(
        `Socket Mismatch: CPU "${cpu.name}" requires socket ${cpu.socket}, but Motherboard "${mobo.name}" uses ${mobo.socket}. They will not physically fit together.`
      );
    }
  }

  // 2. Motherboard vs RAM Generation
  if (mobo && ram) {
    if (mobo.ramType && ram.ramType && mobo.ramType !== ram.ramType) {
      issues.push(
        `RAM Type Incompatibility: Motherboard "${mobo.name}" requires ${mobo.ramType} RAM, but selected "${ram.name}" is ${ram.ramType}.`
      );
    }
  }

  // 3. Power Consumption & PSU Sizing
  const cpuTdp = cpu?.tdp ?? 65;
  const gpuTdp = gpu?.tdp ?? (gpu?.id === 'gpu-none' ? 0 : 120);
  const baseMotherboardFansWattage = 70; // Motherboard chipset, RAM sticks, NVMe SSD, 3-4 ARGB case fans

  const estimatedWattage = Math.round(cpuTdp + gpuTdp + baseMotherboardFansWattage);
  // PSU sizing recommendation: 1.35x headroom for transient spikes
  const recommendedWattage = Math.max(450, Math.ceil((estimatedWattage * 1.35) / 50) * 50);

  if (psu) {
    if (psu.wattage < estimatedWattage) {
      issues.push(
        `Critical Under-Power: Selected PSU (${psu.wattage}W) provides less than the estimated system draw (${estimatedWattage}W). System will reboot or fail under gaming loads.`
      );
    } else if (psu.wattage < recommendedWattage) {
      warnings.push(
        `Tight Power Headroom: Selected PSU is ${psu.wattage}W. While operational, ${recommendedWattage}W is recommended to safely handle GPU transient power spikes.`
      );
    }
  }

  // 4. Form Factor Check
  if (caseComp && mobo) {
    if (caseComp.formFactor === 'Micro-ATX' && mobo.formFactor === 'ATX') {
      issues.push(
        `Size Mismatch: ATX motherboard "${mobo.name}" cannot fit into a Micro-ATX cabinet "${caseComp.name}".`
      );
    }
  }

  // 5. Missing Core Component Warnings
  const requiredParts = [
    { key: 'cpu', label: 'Processor (CPU)' },
    { key: 'motherboard', label: 'Motherboard' },
    { key: 'ram', label: 'RAM (Memory)' },
    { key: 'storage', label: 'Storage (SSD)' },
    { key: 'psu', label: 'Power Supply (PSU)' },
    { key: 'case', label: 'Cabinet (Case)' },
  ];

  for (const part of requiredParts) {
    if (!components[part.key]) {
      warnings.push(`Incomplete Build: No ${part.label} selected yet.`);
    }
  }

  const isCompatible = issues.length === 0;

  return {
    isCompatible,
    issues,
    warnings,
    estimatedWattage,
    recommendedWattage,
  };
}

/**
 * Calculates total prices across Amazon, Flipkart, and Best Mixed Deal.
 */
export function calculateBuildTotals(components = {}) {
  let amazonTotal = 0;
  let flipkartTotal = 0;
  let mixedTotal = 0;

  for (const comp of Object.values(components)) {
    if (!comp) continue;
    const amz = Number(comp.priceAmazon) || 0;
    const flp = Number(comp.priceFlipkart) || 0;

    amazonTotal += amz;
    flipkartTotal += flp;
    mixedTotal += Math.min(amz, flp);
  }

  const potentialSavings = Math.max(0, Math.max(amazonTotal, flipkartTotal) - mixedTotal);

  return {
    amazonTotal,
    flipkartTotal,
    bestMixedTotal: mixedTotal,
    potentialSavings,
  };
}

/**
 * Intelligent recommendation wizard that suggests complete, 100% compatible PC builds
 * tailored to use case, target budget (INR), and brand preference.
 */
export function recommendBuilds({ useCase = '1080p_gaming', budget = 65000, brandPreference = 'any' }) {
  const numBudget = Number(budget) || 65000;
  const brand = (brandPreference || 'any').toLowerCase();

  // Helper to find item by ID
  const findItem = (category, id) => COMPONENT_CATALOG[category].find((item) => item.id === id);

  const builds = [];

  // Profile 1: Budget Entry Office / Light Work (~₹25,000 - ₹35,000)
  if (useCase === 'budget_office' || numBudget <= 40000) {
    const isIntel = brand === 'intel';
    const cpu = isIntel ? findItem('cpu', 'cpu-i3-12100f') : findItem('cpu', 'cpu-r5-5600');
    const mobo = isIntel ? findItem('motherboard', 'mobo-h610m-ddr4') : findItem('motherboard', 'mobo-b450m-pro');

    const comps = {
      cpu,
      motherboard: mobo,
      gpu: findItem('gpu', 'gpu-none'),
      ram: findItem('ram', 'ram-ddr4-16gb'),
      storage: findItem('storage', 'ssd-500gb'),
      psu: findItem('psu', 'psu-550w'),
      case: findItem('case', 'case-ice100'),
      cooler: findItem('cooler', 'cooler-stock'),
    };

    const totals = calculateBuildTotals(comps);
    const compat = checkCompatibility(comps);

    builds.push({
      id: 'rec-budget-office',
      name: 'Essential Office & Productivity Build',
      tagline: 'Smooth Multitasking, Fast NVMe Boot, Budget Friendly',
      tier: 'Budget Friendly',
      useCase: 'Office & Light Daily Work',
      badge: 'Best Value Under ₹35k',
      components: comps,
      totals,
      compatibility: compat,
      highlights: [
        'Fast 6-Core / 4-Core CPU for instant application launching',
        'High-speed NVMe SSD ensures 5-second Windows boot',
        'Reliable 550W PSU leaves room for a future discrete graphics card',
      ],
    });
  }

  // Profile 2: 1080p High FPS Gaming / Budget Esports (~₹50,000 - ₹65,000)
  if (useCase === '1080p_gaming' || (numBudget >= 40000 && numBudget <= 75000) || builds.length === 0) {
    const isAmdGpu = brand === 'amd' || brand === 'any';
    const selectedGpu = isAmdGpu ? findItem('gpu', 'gpu-rx-6600') : findItem('gpu', 'gpu-rtx-3050');
    const selectedCpu = brand === 'intel' ? findItem('cpu', 'cpu-i5-12400f') : findItem('cpu', 'cpu-r5-5600');
    const selectedMobo = brand === 'intel' ? findItem('motherboard', 'mobo-h610m-ddr4') : findItem('motherboard', 'mobo-b450m-pro');

    const comps = {
      cpu: selectedCpu,
      motherboard: selectedMobo,
      gpu: selectedGpu,
      ram: findItem('ram', 'ram-ddr4-16gb'),
      storage: findItem('storage', 'ssd-1tb-nv2'),
      psu: findItem('psu', 'psu-550w'),
      case: findItem('case', 'case-ice100'),
      cooler: findItem('cooler', 'cooler-stock'),
    };

    const totals = calculateBuildTotals(comps);
    const compat = checkCompatibility(comps);

    builds.push({
      id: 'rec-1080p-value',
      name: '1080p High-FPS Gaming Sweet Spot',
      tagline: 'Runs GTA V, Valorant, Cyberpunk 2077 & Warzone at 60-120+ FPS',
      tier: 'Mid-Range Gamer',
      useCase: '1080p Gaming & Streaming',
      badge: 'Most Popular',
      components: comps,
      totals,
      compatibility: compat,
      highlights: [
        `Smooth 1080p Ultra gaming powered by ${selectedGpu.name}`,
        '1TB NVMe Gen4 SSD for multiple modern AAA game installs',
        'High air-flow chassis with 4x pre-installed cooling fans',
      ],
    });
  }

  // Profile 3: 1440p High-End Gaming & Content Creation (~₹80,000 - ₹1,25,000)
  if (useCase === '1440p_gaming' || useCase === 'editing_workstation' || numBudget >= 75000) {
    const isAmdCpu = brand !== 'intel';
    const cpu = isAmdCpu ? findItem('cpu', 'cpu-r5-7600') : findItem('cpu', 'cpu-i5-13600k');
    const mobo = isAmdCpu ? findItem('motherboard', 'mobo-b650m-pro') : findItem('motherboard', 'mobo-b760m-ddr5');
    const gpu = brand === 'amd' ? findItem('gpu', 'gpu-rx-7800xt') : findItem('gpu', 'gpu-rtx-4070super');

    const comps = {
      cpu,
      motherboard: mobo,
      gpu,
      ram: findItem('ram', 'ram-ddr5-32gb'),
      storage: findItem('storage', 'ssd-1tb-sn770'),
      psu: findItem('psu', 'psu-750w-gold'),
      case: findItem('case', 'case-cc560'),
      cooler: findItem('cooler', 'cooler-ag400'),
    };

    const totals = calculateBuildTotals(comps);
    const compat = checkCompatibility(comps);

    builds.push({
      id: 'rec-1440p-powerhouse',
      name: '1440p 2K Ultra & Creator Powerhouse',
      tagline: 'Next-Gen DDR5 Platform with Ray Tracing & DLSS 3 / FSR 3',
      tier: 'High Performance',
      useCase: '1440p Gaming / 4K Video Editing / AI',
      badge: 'Editor Choice',
      components: comps,
      totals,
      compatibility: compat,
      highlights: [
        'DDR5 6000MHz Low Latency Dual Channel RAM kit',
        '80+ Gold certified modular power supply for rock-solid stability',
        'Dedicated tower cooler keeps CPU temperatures low during render loops',
      ],
    });
  }

  // Profile 4: Extreme 4K Enthusiast / AI Machine Learning (~₹1,80,000 - ₹2,50,000+)
  if (useCase === '4k_gaming' || useCase === 'coding_ai' || numBudget >= 150000) {
    const cpu = brand === 'intel' ? findItem('cpu', 'cpu-i7-14700k') : findItem('cpu', 'cpu-r7-7800x3d');
    const mobo = brand === 'intel' ? findItem('motherboard', 'mobo-b760-tomahawk') : findItem('motherboard', 'mobo-b650-tuf');

    const comps = {
      cpu,
      motherboard: mobo,
      gpu: findItem('gpu', 'gpu-rtx-4080super'),
      ram: useCase === 'coding_ai' ? findItem('ram', 'ram-ddr5-64gb') : findItem('ram', 'ram-ddr5-32gb'),
      storage: findItem('storage', 'ssd-2tb-p3plus'),
      psu: findItem('psu', 'psu-850w-gold'),
      case: findItem('case', 'case-lancool216'),
      cooler: findItem('cooler', 'cooler-ls520'),
    };

    const totals = calculateBuildTotals(comps);
    const compat = checkCompatibility(comps);

    builds.push({
      id: 'rec-4k-flagship',
      name: 'Flagship 4K Ultra & AI Deep Learning Rig',
      tagline: 'RTX 4080 Super 16GB VRAM + 240mm AIO Liquid Cooling',
      tier: 'Enthusiast Flagship',
      useCase: '4K Native Gaming / LLM Fine-Tuning / 3D Blender',
      badge: 'Ultimate Performance',
      components: comps,
      totals,
      compatibility: compat,
      highlights: [
        'RTX 4080 Super with 16GB high-bandwidth VRAM for generative AI & 4K gaming',
        '240mm liquid AIO cooler for sustained clock speeds under maximum compute load',
        'High-capacity 2TB NVMe PCIe 4.0 SSD for heavy datasets and AAA game libraries',
      ],
    });
  }

  return builds;
}

/**
 * Converts a saved or simulated PC build into real tracked items in the user's Price Tracker dashboard.
 * Automatically creates a dedicated product group (e.g., "PC Build: Ryzen 5 Gaming Rig")
 * and adds each component with simulated demo price history, allowing the user to track price drops!
 */
export async function convertBuildToTrackedProducts(userId, { name, components = {} }) {
  const groupName = `PC Build: ${name || 'Custom Rig'}`;

  // Find or create the product group
  let group = await groupModel.findGroupByName(groupName, userId);
  if (!group) {
    group = await groupModel.createGroup({
      name: groupName,
      category: 'PC Build',
      userId,
    });
  }

  const createdProducts = [];
  const entries = Object.entries(components).filter(([, comp]) => comp && comp.name && comp.id !== 'gpu-none' && comp.id !== 'cooler-stock');

  for (const [slot, comp] of entries) {
    const isAmazon = Boolean(comp.urlAmazon);
    const platform = isAmazon ? 'amazon' : 'flipkart';
    const url = comp.urlAmazon || comp.urlFlipkart || `https://www.amazon.in/dp/${comp.id}`;
    const productKey = `${platform}:${comp.id}`;

    // Check if product already exists for this user
    let existing = await productModel.findByProductKey(userId, productKey);
    let product;

    if (!existing) {
      product = await productModel.createProduct({
        name: comp.name,
        url,
        platform,
        category: `PC Component - ${slot.toUpperCase()}`,
        groupId: group.id,
        userId,
        productKey,
        isDemo: true,
      });

      if (comp.image) {
        await productModel.updateProductImage(product.id, comp.image);
      }

      // Seed initial simulated price points
      const basePrice = Number(comp.priceAmazon) || Number(comp.priceFlipkart) || 5000;
      const historyPoints = [
        { daysAgo: 14, price: Math.round(basePrice * 1.05) },
        { daysAgo: 7, price: Math.round(basePrice * 1.02) },
        { daysAgo: 0, price: basePrice },
      ];

      for (const pt of historyPoints) {
        const scrapedAt = new Date(Date.now() - pt.daysAgo * 86400000).toISOString();
        await productModel.insertPriceHistory({
          productId: product.id,
          price: pt.price,
          currency: 'INR',
          scrapedAt,
          isSimulated: true,
          simulationLabel: 'pc_builder_catalog',
        });
      }

      // Setup a price drop alert (5% below current price)
      const targetAlert = Math.round(basePrice * 0.95);
      await alertModel.upsertAlert(userId, product.id, targetAlert);

      createdProducts.push(product);
    } else {
      // If product already exists, ensure it is assigned to this group
      await productModel.updateProductGroup(existing.id, group.id);
      createdProducts.push(existing);
    }
  }

  return {
    group,
    trackedCount: createdProducts.length,
    products: createdProducts,
  };
}
