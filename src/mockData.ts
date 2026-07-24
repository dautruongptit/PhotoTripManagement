import type { TravelEvent, User } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Nguyễn Văn An',
  email: 'vanan@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format&q=80',
};

const p = (id: string, name: string, uid: string, w: number, h: number, mb: number, daysAgo: number) => {
  const date = new Date('2026-07-24');
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    name,
    url: `https://images.unsplash.com/photo-${uid}?w=1920&auto=format&q=80`,
    size: Math.round(mb * 1024 * 1024),
    width: w,
    height: h,
    uploadedAt: date.toISOString(),
    uploadedBy: 'user-1',
  };
};

export const mockEvents: TravelEvent[] = [
  {
    id: 'event-1',
    name: 'Đà Lạt 2026',
    description: 'Chuyến du lịch cùng công ty tới thành phố ngàn hoa. Khám phá vườn hoa Đà Lạt, hồ Xuân Hương và những con đường thơ mộng bên những rừng thông bạt ngàn.',
    startDate: '2026-07-15',
    endDate: '2026-07-18',
    location: 'Đà Lạt, Lâm Đồng',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop&auto=format',
    photos: [
      p('p1', 'IMG_001.jpg', '1506905925346-21bda4d32df4', 1920, 1280, 3.8, 5),
      p('p2', 'IMG_002.jpg', '1470770841072-f978cf4d019e', 1920, 1080, 2.1, 5),
      p('p3', 'IMG_003.jpg', '1501854140801-50d01698950b', 2560, 1440, 5.2, 4),
      p('p4', 'IMG_004.jpg', '1476514525535-07fb3b4ae5f1', 1920, 1280, 3.4, 4),
      p('p5', 'IMG_005.jpg', '1473448912268-2022ce9509d8', 1920, 1080, 2.8, 3),
      p('p6', 'IMG_006.jpg', '1504609813442-a8924e83f76e', 1920, 1440, 4.1, 3),
      p('p7', 'IMG_007.jpg', '1488646953014-85cb44e25828', 2048, 1365, 4.5, 2),
      p('p8', 'IMG_008.jpg', '1519681393784-d120267933ba', 1920, 1080, 3.2, 2),
    ],
    createdBy: 'user-1',
    createdAt: '2026-07-10T08:00:00Z',
  },
  {
    id: 'event-2',
    name: 'Hội An 2025',
    description: 'Khám phá phố cổ Hội An với những chiếc đèn lồng lung linh và ẩm thực đặc sắc của miền Trung Việt Nam.',
    startDate: '2025-12-20',
    endDate: '2025-12-23',
    location: 'Hội An, Quảng Nam',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop&auto=format',
    photos: [
      p('p9',  'IMG_001.jpg', '1558618666-fcd25c85cd64', 1920, 1280, 3.6, 216),
      p('p10', 'IMG_002.jpg', '1537953773345-d172ccf13cf1', 1920, 1080, 2.9, 216),
      p('p11', 'IMG_003.jpg', '1527631746610-bab684635399', 2560, 1440, 5.1, 215),
      p('p12', 'IMG_004.jpg', '1500534314209-a25ddb2bd429', 1920, 1280, 3.3, 215),
      p('p13', 'IMG_005.jpg', '1551632811-561732d1e306', 1920, 1080, 2.7, 214),
      p('p14', 'IMG_006.jpg', '1494500764479-0c8f2919a3d8', 1920, 1440, 4.0, 214),
    ],
    createdBy: 'user-1',
    createdAt: '2025-12-15T10:00:00Z',
  },
  {
    id: 'event-3',
    name: 'Phú Quốc 2025',
    description: "Nghỉ dưỡng tại đảo ngọc Phú Quốc — bãi biển trắng mịn, nước biển xanh trong vắt và những buổi hoàng hôn rực rỡ.",
    startDate: '2025-06-10',
    endDate: '2025-06-14',
    location: 'Phú Quốc, Kiên Giang',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop&auto=format',
    photos: [
      p('p15', 'IMG_001.jpg', '1507525428034-b723cf961d3e', 1920, 1280, 3.9, 409),
      p('p16', 'IMG_002.jpg', '1518173946687-a4c8892bbd9f', 1920, 1080, 2.2, 409),
      p('p17', 'IMG_003.jpg', '1469854523086-cc02fe5d8800', 2560, 1440, 5.3, 408),
      p('p18', 'IMG_004.jpg', '1546412414-e1885259563a', 1920, 1280, 3.7, 408),
      p('p19', 'IMG_005.jpg', '1559494007-9f5547c5d15c', 1920, 1080, 2.5, 407),
      p('p20', 'IMG_006.jpg', '1507003211169-0a1dd7228f2d', 1920, 1440, 4.4, 407),
      p('p21', 'IMG_007.jpg', '1533587851344-e9b9b4abb0c4', 1920, 1080, 3.1, 406),
    ],
    createdBy: 'user-1',
    createdAt: '2025-06-01T09:00:00Z',
  },
  {
    id: 'event-4',
    name: 'Sapa 2024',
    description: "Trekking qua những ruộng bậc thang xanh mướt, gặp gỡ người dân tộc H'Mông và ngắm cảnh núi non hùng vĩ nơi biên cương.",
    startDate: '2024-09-05',
    endDate: '2024-09-08',
    location: 'Sapa, Lào Cai',
    coverImage: 'https://images.unsplash.com/photo-1531329317-d8c8ababff49?w=800&h=500&fit=crop&auto=format',
    photos: [
      p('p22', 'IMG_001.jpg', '1531329317-d8c8ababff49', 1920, 1280, 3.8, 688),
      p('p23', 'IMG_002.jpg', '1464822759023-fed622ff2c3b', 1920, 1080, 2.4, 688),
      p('p24', 'IMG_003.jpg', '1511497584788-876760111969', 2560, 1440, 5.0, 687),
      p('p25', 'IMG_004.jpg', '1535406208535-4b077f6dc40d', 1920, 1280, 3.5, 686),
      p('p26', 'IMG_005.jpg', '1476514525535-07fb3b4ae5f1', 1920, 1080, 2.6, 685),
    ],
    createdBy: 'user-1',
    createdAt: '2024-08-28T11:00:00Z',
  },
];
