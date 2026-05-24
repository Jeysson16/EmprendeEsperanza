export const getCategoryIconName = (category?: string | null): any => {
  const cat = (category || '').toLowerCase();

  if (cat.includes('restaurante') || cat.includes('restaurant') || cat.includes('comida')) return 'restaurant-outline';
  if (cat.includes('panaderia') || cat.includes('panadería') || cat.includes('pan')) return 'cafe-outline';
  if (cat.includes('carniceria') || cat.includes('carnicería') || cat.includes('carne')) return 'bonfire-outline';
  if (cat.includes('farmacia') || cat.includes('botica') || cat.includes('salud')) return 'medkit-outline';

  if (cat.includes('bodega') || cat.includes('tienda') || cat.includes('comercio')) return 'cart-outline';
  if (cat.includes('ropa') || cat.includes('moda') || cat.includes('vest')) return 'shirt-outline';
  if (cat.includes('belleza') || cat.includes('peluquer') || cat.includes('barber')) return 'cut-outline';
  if (cat.includes('ferreter') || cat.includes('taller') || cat.includes('repar')) return 'hammer-outline';
  if (cat.includes('tecnolog') || cat.includes('comput') || cat.includes('celular') || cat.includes('phone')) return 'hardware-chip-outline';
  if (cat.includes('librer') || cat.includes('papeler')) return 'book-outline';
  if (cat.includes('veter') || cat.includes('mascot') || cat.includes('pet')) return 'paw-outline';
  if (cat.includes('artesan') || cat.includes('manual')) return 'color-palette-outline';
  if (cat.includes('educ') || cat.includes('coleg') || cat.includes('escuela')) return 'school-outline';
  if (cat.includes('lavander')) return 'water-outline';

  return 'storefront-outline';
};
