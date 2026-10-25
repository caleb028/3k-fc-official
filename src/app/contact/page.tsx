import React from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-12">
      <div className="border-b-2 border-slate-900 pb-6">
        <p className="athletic-label text-xs font-extrabold text-club-primary">
          Club Secretariat &amp; Departmental Directory
        </p>
        <h1 className="editorial-headline font-black text-3xl md:text-5xl text-slate-900 mt-1">
          Contact 3K FC
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Get in touch with the 3K FC secretariat, media accreditation desk, ticketing support, and commercial department in Embu County.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-900 text-white p-6 md:p-8 space-y-6 border border-slate-800 shadow-md">
            <h2 className="font-display font-bold text-2xl text-white">
              Secretariat Headquarters
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-club-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-sm">Physical Address</strong>
                  <span className="text-slate-300">
                    Moi Stadium Complex, Embu Town, Embu County, Kenya
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-club-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-sm">Official Email Inquiries</strong>
                  <span className="text-slate-300 block">General: official@3kfc.co.ke</span>
                  <span className="text-slate-300 block">Media &amp; Press: media@3kfc.co.ke</span>
                  <span className="text-slate-300 block">Ticketing: tickets@3kfc.co.ke</span>
                  <span className="text-slate-300 block">Store &amp; Orders: shop@3kfc.co.ke</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-club-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-sm">Telephone Hotline</strong>
                  <span className="text-slate-300 block">+254 700 300 300 (Mon - Fri, 8:00am - 5:00pm EAT)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Registered under Football Kenya Federation</span>
            </div>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <form className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-club-primary">
              <MessageSquare className="w-4 h-4" />
              <span>Send a Message to the Secretariat</span>
            </div>
            <h2 className="editorial-headline font-bold text-2xl text-slate-900">
              Online Departmental Routing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="07XXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <select className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white font-medium">
                  <option value="GENERAL">General Supporter Inquiry</option>
                  <option value="MEDIA">Media &amp; Matchday Press Accreditation</option>
                  <option value="TICKETS">Ticketing &amp; Gate Entry Support</option>
                  <option value="STORE">Official Store &amp; Merchandise Orders</option>
                  <option value="MEMBERSHIP">Supporters Club &amp; Loyalty Points</option>
                  <option value="COMMUNITY">Community &amp; Youth Outreach</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Subject</label>
              <input
                type="text"
                required
                placeholder="Brief subject of inquiry"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message</label>
              <textarea
                rows={5}
                required
                placeholder="Write your message here..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition shadow"
            >
              <Send className="w-4 h-4" />
              <span>Deliver Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
