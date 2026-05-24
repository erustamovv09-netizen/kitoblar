import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowLeft, Heart, Share2, BookOpen } from 'lucide-react';
import styles from './page.module.css';
import { notFound } from 'next/navigation';

const booksDB = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    price: "65,000 so'm",
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
    category: 'Shaxsiy rivojlanish',
    description: 'Yomon odatlardan xalos bo\'lish va yaxshi odatlarni shakllantirish bo\'yicha dunyodagi 1 raqamli bestseller. Ushbu kitob orqali siz hayotingizni kichik o\'zgarishlar bilan qanday qilib tubdan yaxshilash mumkinligini o\'rganasiz. Jeyms Klir odatlarni shakllantirishning ilmiy isbotlangan usullarini oson til bilan tushuntirib bergan.',
    pages: 320,
    language: "O'zbek tili",
    publishedYear: 2018
  },
  {
    id: '2',
    title: 'Ikigai',
    author: 'Hector Garcia',
    price: "50,000 so'm",
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: 'Falsafa',
    description: 'Uzoq va baxtli hayot kechirishning yapon siri. Yaponiyaning Okinava oroli aholisining uzoq umr ko\'rish sirlarini o\'rganuvchi ushbu kitob, har bir insonning hayotdagi o\'z maqsadini (ikigai) topishiga yordam beradi.',
    pages: 208,
    language: "O'zbek tili",
    publishedYear: 2016
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    price: "85,000 so'm",
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop',
    category: 'Tarix',
    description: 'Insoniyatning qisqacha tarixi. Y.N. Harari insoniyat qanday qilib oddiy maymundan dunyo hukmdoriga aylangani va bu yo\'lda nimalarni yo\'qotib, nimalarni topgani haqida juda qiziqarli xulosalarni beradi.',
    pages: 512,
    language: "O'zbek tili",
    publishedYear: 2011
  },
  {
    id: 'hero',
    title: "O'tkan kunlar",
    author: 'Abdulla Qodiriy',
    price: "45,000 so'm",
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: 'Badiiy',
    description: 'O\'zbek adabiyotidagi birinchi roman. Asarda XIX asr o\'rtalaridagi Toshkent va Qo\'qon hayoti, muhabbat va xiyonat, qahramonlik va fojia tasvirlangan. Kumush va Otabekning sof muhabbati, ularning ayanchli qismati orqali o\'sha davr tuzumi va jamiyatdagi muammolar ochib berilgan.',
    pages: 400,
    language: "O'zbek tili",
    publishedYear: 1922
  }
];

export default async function BookDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const book = booksDB.find(b => b.id === resolvedParams.id);
  
  if (!book) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Orqaga qaytish</span>
        </Link>
        
        <div className={styles.content}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <Image 
                src={book.image}
                alt={book.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
                className={styles.image}
              />
            </div>
          </div>
          
          <div className={styles.infoSection}>
            <div className={styles.badge}>{book.category}</div>
            <h1 className={styles.title}>{book.title}</h1>
            <p className={styles.author}>{book.author}</p>
            
            <div className={styles.metaRow}>
              <div className={styles.rating}>
                <Star size={20} fill="currentColor" />
                <span>{book.rating}</span>
              </div>
              <div className={styles.divider}>•</div>
              <div className={styles.metaItem}>{book.pages} bet</div>
              <div className={styles.divider}>•</div>
              <div className={styles.metaItem}>{book.language}</div>
              <div className={styles.divider}>•</div>
              <div className={styles.metaItem}>{book.publishedYear}</div>
            </div>
            
            <div className={styles.priceRow}>
              <span className={styles.price}>{book.price}</span>
            </div>
            
            <div className={styles.description}>
              <h3>Kitob haqida</h3>
              <p>{book.description}</p>
            </div>
            
            <div className={styles.actionButtons}>
              <button className={styles.primaryBtn}>
                <BookOpen size={20} />
                Sotib olish
              </button>
              <button className={styles.iconBtn}>
                <Heart size={24} />
              </button>
              <button className={styles.iconBtn}>
                <Share2 size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
