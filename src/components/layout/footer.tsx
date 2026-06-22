// src/components/layout/footer.tsx
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#111A16] border-t border-[#1E3A2B] px-6 py-8 mt-auto pb-24 md:pb-8 text-sm">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Information */}
        <div className="space-y-4">
          <div>
            <span className="text-xl font-black tracking-wider text-primary">SHIVAY</span>
            <p className="text-xs text-[#6B8F7E] uppercase font-semibold">The Cricketing Hub</p>
          </div>
          <p className="text-[#A7C4B8] text-xs leading-relaxed max-w-sm">
            Experience premium sports venue bookings. State-of-the-art Cricket box turfs and high-performance Acrylic Pickleball courts in Karai.
          </p>
          <div className="flex gap-4">
            <a 
              href="https://www.instagram.com/shivay_thecricketinghub/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#1A2620] border border-[#1E3A2B] text-primary hover:bg-primary hover:text-[#0A0F0D] transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Policy links */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-primary tracking-widest">Policies & Info</h3>
          <ul className="space-y-2.5 text-xs text-[#A7C4B8]">
            <li>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-primary transition-colors">Cancellation & Refund Policy</Link>
            </li>
          </ul>
        </div>

        {/* Contact details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-primary tracking-widest">Contact & Location</h3>
          <ul className="space-y-3 text-xs text-[#A7C4B8]">
            <li className="flex items-start gap-3">
              <MapPin className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
              <span>Shivay Box Cricket and Pickleball, Karai Dam Road, Karai, Gujarat 382330</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4.5 h-4.5 text-primary shrink-0" />
              <a href="tel:+919998168681" className="hover:underline">+91 99981 68681</a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4.5 h-4.5 text-primary shrink-0" />
              <a href="mailto:contact@shivaycricketinghub.com" className="hover:underline">contact@shivaycricketinghub.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-4xl mx-auto border-t border-[#1E3A2B] mt-8 pt-6 text-center text-[10px] text-[#6B8F7E]">
        <p>&copy; {new Date().getFullYear()} Shivay - The Cricketing Hub. All rights reserved.</p>
        <p className="mt-1">Built as a Production-Ready Progressive Web App.</p>
      </div>
    </footer>
  );
}
