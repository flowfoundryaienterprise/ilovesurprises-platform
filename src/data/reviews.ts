import type { Review } from '../types';

export const reviewsData: Review[] = [
  {
    id: 'rev-01',
    author: 'Sarah Jenkins',
    location: 'Austin, TX',
    rating: 5,
    date: '2 days ago',
    title: 'Found a gorgeous $250 Sterling Silver ring!',
    comment: 'I bought the Sparkling Rose Gold candle for my sister’s birthday and was blown away. The scent filled the whole living room, and after a couple of burns we found a stunning ring wrapped safely inside! Such an exciting unboxing experience.',
    verified: true,
    productName: 'Sparkling Rose Gold Jewelry Candle',
    revealedSurprise: 'Sterling Silver Teardrop Ring ($250 value)',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp'
  },
  {
    id: 'rev-02',
    author: 'Marcus Vance',
    location: 'Denver, CO',
    rating: 5,
    date: '1 week ago',
    title: 'Won a crisp $50 bill inside the Cola Candle!',
    comment: 'Got this as a gag gift for my brother, but it ended up being the highlight of our family gathering. The soda scent is surprisingly realistic and great quality, and inside was an authentic $50 bill! Definitely buying again for Christmas.',
    verified: true,
    productName: 'Classic Vintage Cola Cash Candle',
    revealedSurprise: 'Real $50 Cash Bill Reveal',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp'
  },
  {
    id: 'rev-03',
    author: 'Chloe Davenport',
    location: 'Miami, FL',
    rating: 5,
    date: '2 weeks ago',
    title: 'Appraised at $550! 14K Gold CZ Stud Earrings',
    comment: 'The scent throw on this soy candle is 10/10. When the foil appeared, I used tweezers and unwrapped the most gorgeous gold earrings. Took them to our local jeweler and they verified authentic 14K gold!',
    verified: true,
    productName: 'Luxury Vanilla Cash & Jewelry Candle',
    revealedSurprise: '14K Gold CZ Stud Earrings ($550 value)',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp'
  },
  {
    id: 'rev-04',
    author: 'David K. Reynolds',
    location: 'Nashville, TN',
    rating: 5,
    date: '3 weeks ago',
    title: 'Unbelievable $100 Cash Bill inside Dr Pepper candle!',
    comment: 'Ordered 2 candles expecting a $2 bill, but pulled out a genuine $100 bill! The candle smells amazing like authentic spiced cherry soda. My wife and kids were screaming with joy.',
    verified: true,
    productName: 'Dr Pepper Cash Soda Pop Candle',
    revealedSurprise: 'Real $100 Cash Bill Reveal',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp'
  }
];

export const trustHighlights = [
  {
    title: 'Real Surprise in Every Item',
    description: 'Every candle, wax melt, and soap comes with a genuine jewelry or cash reveal inside.',
    icon: 'Sparkles'
  },
  {
    title: '100% Hand-Poured Soy Wax',
    description: 'Clean-burning natural soy wax infused with premium essential oils and lead-free cotton wicks.',
    icon: 'Flame'
  },
  {
    title: 'Secure First-Party Fulfillment',
    description: 'Every order is carefully inspected, packed in premium gift boxing, and tracked door-to-door.',
    icon: 'ShieldCheck'
  },
  {
    title: 'Community & Affiliate Rewards',
    description: 'Share the joy with friends and earn 20% direct commissions plus multi-tier rewards.',
    icon: 'Gift'
  }
];
