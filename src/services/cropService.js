const CROP_API_BASE_URL = '';

let demoCrops = [
  {
    id: '1',
    name: 'Wheat',
    category: 'Grains',
    quantity: '500 kg',
    price: '\u20B928/kg',
    quality: 'A+',
    status: 'Available',
  },
  {
    id: '2',
    name: 'Rice (Basmati)',
    category: 'Grains',
    quantity: '1000 kg',
    price: '\u20B965/kg',
    quality: 'A',
    status: 'Reserved',
  },
  {
    id: '3',
    name: 'Tomatoes',
    category: 'Vegetables',
    quantity: '200 kg',
    price: '\u20B940/kg',
    quality: 'A',
    status: 'Available',
  },
  {
    id: '4',
    name: 'Onions',
    category: 'Vegetables',
    quantity: '800 kg',
    price: '\u20B922/kg',
    quality: 'B',
    status: 'Available',
  },
];

const buildUrl = (path) => {
  const baseUrl = CROP_API_BASE_URL.trim();
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, '')}${path}`;
};

const normalizeCrop = (crop, index) => ({
  id: String(crop._id ?? crop.id ?? Date.now() + index),
  name: crop.cropName ?? crop.name ?? 'Unnamed Crop',
  category: crop.category ?? 'Other',
  quantity: `${crop.quantity ?? 0} kg`,
  price: `\u20B9${crop.price ?? 0}/kg`,
  quality: crop.qualityGrade ?? crop.quality ?? 'N/A',
  status: crop.status ?? 'Available',
});

export const getCrops = async () => {
  const url = buildUrl('/crops');

  if (!url) {
    return { crops: demoCrops, mode: 'demo' };
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Crop fetch failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      crops: Array.isArray(data) ? data.map(normalizeCrop) : demoCrops,
      mode: 'remote',
    };
  } catch (error) {
    console.warn('Falling back to demo crops:', error);
    return { crops: demoCrops, mode: 'demo' };
  }
};

export const addCrop = async ({ name, category, quantity, price, quality }) => {
  const payload = {
    cropName: name.trim(),
    category,
    quantity: Number(quantity),
    price: Number(price),
    qualityGrade: quality,
    farmerId: 'demo-farmer-1',
  };

  const url = buildUrl('/addCrop');

  if (!url) {
    const demoCrop = normalizeCrop(
      {
        id: `demo-${Date.now()}`,
        ...payload,
        status: 'Available',
      },
      0
    );

    demoCrops = [demoCrop, ...demoCrops];
    return { crop: demoCrop, mode: 'demo' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Crop save failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      crop: normalizeCrop(data.data ?? payload, 0),
      mode: 'remote',
    };
  } catch (error) {
    console.warn('Falling back to demo crop save:', error);

    const demoCrop = normalizeCrop(
      {
        id: `demo-${Date.now()}`,
        ...payload,
        status: 'Available',
      },
      0
    );

    demoCrops = [demoCrop, ...demoCrops];
    return { crop: demoCrop, mode: 'demo' };
  }
};

export const isCropApiConfigured = () => Boolean(buildUrl(''));
