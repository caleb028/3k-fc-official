import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Truck, RefreshCw } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatKes } from '@/lib/money';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true, images: true },
  });

  if (!product) {
    notFound();
  }

  const primaryImage = product.images?.[0]?.url || null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 athletic-label text-xs tracking-wider text-club-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Official Store</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm barca-card-hover group">
        <div className="md:col-span-6">
          <AuthenticMediaPlaceholder
            category={product.category}
            label={product.nameEn}
            sublabel={`SKU: ${product.sku} • Official 3K FC Merchandise`}
            aspectRatio="square"
            imageUrl={primaryImage}
            isVerifiedAsset={!!primaryImage}
            className="h-full"
          />
        </div>

        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              {product.isAuthenticClubGear && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified Authentic 3K FC Merchandise
                </span>
              )}
              <span className="font-mono text-slate-500">SKU: {product.sku}</span>
            </div>

            <h1 className="editorial-headline font-black text-2xl md:text-3xl text-slate-900">
              {product.nameEn}
            </h1>

            <p className="font-mono font-black text-3xl text-club-primary mt-3">
              {formatKes(product.priceKesCents)}
            </p>

            <p className="text-sm text-slate-700 mt-4 leading-relaxed">
              {product.descriptionEn}
            </p>

            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Available Sizes &amp; Real-Time Stock
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {product.variants.map((v) => {
                  const avail = Math.max(0, v.stockQuantity - v.reservedQuantity);
                  return (
                    <div
                      key={v.id}
                      className="rounded-lg border border-slate-200 p-2.5 text-center bg-slate-50"
                    >
                      <div className="font-bold text-sm text-slate-900">{v.size}</div>
                      <div className="text-[11px] text-slate-500">{avail} available</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-club-primary shrink-0" />
                <span>Free collection in Embu Town or nationwide courier delivery.</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-club-primary shrink-0" />
                <span>14-day size exchange on unworn items with original club tags.</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/shop"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition"
            >
              Add to Cart &amp; Checkout on Store Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
