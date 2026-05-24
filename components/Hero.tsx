"use client";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className={styles.badge}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hafta kitobi
          </motion.div>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            O'tkan kunlar
          </motion.h1>
          <motion.p
            className={styles.author}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Muallif: Abdulla Qodiriy
          </motion.p>
          <motion.p
            className={styles.description}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            O'zbek adabiyotidagi birinchi roman. Asarda XIX asr o'rtalaridagi Toshkent va Qo'qon hayoti, muhabbat va xiyonat, qahramonlik va fojia tasvirlangan.
          </motion.p>
          <motion.div
            className={styles.buttons}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/book/hero" className={styles.primaryBtn}>O'qishni boshlash</Link>
            <Link href="/book/hero" className={styles.secondaryBtn}>Batafsil ma'lumot</Link>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.imageWrapper}
          initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.05, rotate: 2 }}
        >
          <Link href="/book/hero" style={{ display: 'block', width: '100%' }}>
            <Image
              src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"
              alt="O'tkan kunlar"
              width={500}
              height={600}
              className={styles.image}
              priority
              loading="eager"
              unoptimized
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
