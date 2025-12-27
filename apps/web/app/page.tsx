"use client";
import Image from "next/image";
import { motion, Variants } from "framer-motion"; // 1. Import motion

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut", // TypeScript now accepts this because of the 'Variants' type
      },
    },
  };

  return (
    <div className="absolute inset-0 -z-10 h-full w-full flex items-start justify-center max-h-screen px-5 py-15 sm:py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center max-w-md flex flex-col items-center my-auto"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants}>
          <div className="sm:block hidden">
            <div className="flex justify-center mb-3">
              <Image
                src={"/resq.png"}
                alt="resq logo"
                width={120}
                height={120}
                priority
              />
            </div>
          </div>
          <div className="flex sm:hidden justify-center mb-3">
            <Image
              src={"/resq.png"}
              alt="resq logo"
              width={90}
              height={90}
              priority
            />
          </div>
        </motion.div>

        {/* Text Description */}
        <motion.p
          variants={itemVariants}
          className="text-xs sm:text-sm text-gray-400 font-medium leading-tight px-4 mb-6"
        >
          When disaster hits, every minute counts. Report your emergency with a
          photo and exact location — volunteers in your area will see it
          instantly and come running.
        </motion.p>

        <motion.div variants={itemVariants}>
          <div className="justify-center hidden sm:block sm:my-12">
            <Image
              src={"/resq_bg_converted.avif"}
              alt="bg"
              width={250}
              height={250}
            />
          </div>
          <div className="justify-center block sm:hidden my-8">
            <Image
              src={"/resq_bg_converted.avif"}
              alt="bg"
              width={200}
              height={200}
            />
          </div>
        </motion.div>

        {/* Google Login Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.5)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            (window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`)
          }
          className="w-4/5 bg-black/30 border border-white/20 cursor-pointer text-white font-medium text-sm sm:text-lg py-3 px-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </motion.button>
      </motion.div>
    </div>
  );
}
