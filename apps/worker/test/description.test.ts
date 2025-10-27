import { writeListingDescription } from '../src/lib/description';

describe('writeListingDescription', () => {
  it('includes all configured sections', () => {
    const text = writeListingDescription({
      brand: 'SnapSell',
      model: 'Widget',
      category: 'Accessories',
      condition: 'excellent',
      keyFeatures: ['Feature A', 'Feature B'],
      knownFlaws: ['Small mark'],
      included: ['Box'],
      notIncluded: ['Manual'],
      care: ['Wipe clean'],
      measurements: ['Length 10cm'],
      shippingNote: 'Ships next day',
      returnsNote: '14-day returns',
      crossListNotice: true,
    });

    expect(text).toMatch(/SnapSell · Widget · Accessories/);
    expect(text).toMatch(/Condition: Excellent/);
    expect(text).toMatch(/Details:\n• Feature A\n• Feature B/);
    expect(text).toMatch(/Measurements:/);
    expect(text).toMatch(/Included:/);
    expect(text).toMatch(/Not included:/);
    expect(text).toMatch(/Notes:/);
    expect(text).toMatch(/Ships next day/);
    expect(text).toMatch(/Listed on multiple marketplaces/);
  });

  it('avoids AI-sounding filler phrases', () => {
    const text = writeListingDescription({
      brand: 'SnapSell',
      model: 'Gadget',
      keyFeatures: ['Feature'],
    });
    expect(text.toLowerCase()).not.toMatch(/\bdelighted\b|\bthrilled\b|\bcrafted\b/);
  });
});
