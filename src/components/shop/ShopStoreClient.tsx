'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  CheckCircle2,
  Truck,
  Smartphone,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { formatKes, addMoneyCents, multiplyMoneyCents } from '@/lib/money';
import { AuthenticMediaPlaceholder } from '@/components/ui/AuthenticMediaPlaceholder';

interface VariantData {
  id: string;
  sku: string;
  size: string;
  color: string;
  availableStock: number;
  priceAdjustmentCents: number;
}

interface ProductData {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameSw: string;
  descriptionEn: string;
  category: string;
  priceKesCents: number;
  isAuthenticClubGear: boolean;
  imageUrl?: string | null;
  variants: VariantData[];
}

interface DeliveryOpt {
  code: string;
  nameEn: string;
  feeKesCents: number;
  estimatedDays: string;
}

export function ShopStoreClient({
  products,
  deliveryOptions,
}: {
  products: ProductData[];
  deliveryOptions: DeliveryOpt[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const p of products) {
        if (p.variants[0]) map[p.id] = p.variants[0].id;
      }
      return map;
    }
  );

  const [cart, setCart] = useState<
    Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantLabel: string;
      unitPriceKesCents: number;
      quantity: number;
    }>
  >([]);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryCode, setDeliveryCode] = useState(deliveryOptions[0]?.code || 'EMBU_COLLECTION');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [orderPaymentState, setOrderPaymentState] = useState<{
    orderNumber: string;
    txId: string;
    checkoutRequestId: string;
    totalKesCents: number;
    environment: string;
    status: string;
  } | null>(null);

  const categories = ['ALL', 'JERSEYS', 'TRAINING_WEAR', 'SCARVES', 'CAPS', 'APPAREL', 'ACCESSORIES'];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch =
      !searchTerm.trim() ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descriptionEn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: ProductData) => {
    const variantId = selectedVariantByProduct[product.id] || product.variants[0]?.id;
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || variant.availableStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: Math.min(variant.availableStock, item.quantity + 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.nameEn,
          variantLabel: `${variant.size} • ${variant.color}`,
          unitPriceKesCents: addMoneyCents(product.priceKesCents, variant.priceAdjustmentCents),
          quantity: 1,
        },
      ];
    });
  };

  const selectedDelivery =
    deliveryOptions.find((d) => d.code === deliveryCode) || deliveryOptions[0];

  const cartSubtotalCents = cart.reduce(
    (sum, item) => addMoneyCents(sum, multiplyMoneyCents(item.unitPriceKesCents, item.quantity)),
    0
  );
  const deliveryFeeCents = cart.length > 0 ? selectedDelivery?.feeKesCents || 0 : 0;
  const cartTotalCents = addMoneyCents(cartSubtotalCents, deliveryFeeCents);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          deliveryOptionCode: deliveryCode,
          shippingAddress,
          county: 'Embu',
          items: cart.map((c) => ({
            productId: c.productId,
            variantId: c.variantId,
            quantity: c.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || 'Checkout failed.');
      } else {
        setOrderPaymentState({
          orderNumber: data.order.orderNumber,
          txId: data.payment.id,
          checkoutRequestId: data.payment.checkoutRequestId,
          totalKesCents: data.order.totalKesCents,
          environment: data.payment.environment,
          status: data.payment.status,
        });
        setCart([]);
      }
    } catch {
      setCheckoutError('Network error while submitting store order.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSandboxStorePayment = async () => {
    if (!orderPaymentState) return;
    await fetch('/api/payments/mpesa/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `MR-${orderPaymentState.orderNumber}`,
            CheckoutRequestID: orderPaymentState.checkoutRequestId,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: Math.trunc(orderPaymentState.totalKesCents / 100) },
                { Name: 'MpesaReceiptNumber', Value: '3KSHOP88291' },
              ],
            },
          },
        },
      }),
    });
    const statusRes = await fetch(`/api/payments/${orderPaymentState.txId}/status`, {
      cache: 'no-store',
    });
    if (statusRes.ok) {
      const st = await statusRes.json();
      setOrderPaymentState((prev) =>
        prev ? { ...prev, status: st.transaction.status } : null
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left 8 Cols: Catalog, Filters & Products */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                  selectedCategory === cat
                    ? 'bg-club-primary text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jerseys, scarves..."
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredProducts.map((product) => {
            const activeVarId =
              selectedVariantByProduct[product.id] || product.variants[0]?.id;
            const activeVar = product.variants.find((v) => v.id === activeVarId);

            return (
              <article
                key={product.id}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm barca-card-hover group flex flex-col justify-between"
              >
                <div>
                  <AuthenticMediaPlaceholder
                    category={product.category}
                    label={product.nameEn}
                    sublabel={`SKU: ${product.sku} • Official 3K FC Merchandise`}
                    aspectRatio="square"
                    imageUrl={product.imageUrl}
                    isVerifiedAsset={!!product.imageUrl}
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      {product.isAuthenticClubGear && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Authentic 3K FC Club Gear
                        </span>
                      )}
                      <span className="font-mono text-slate-500">
                        {activeVar && activeVar.availableStock > 0
                          ? `${activeVar.availableStock} in stock`
                          : 'Sold Out'}
                      </span>
                    </div>

                    <h2 className="editorial-headline font-bold text-lg text-slate-900">
                      <Link href={`/shop/${product.slug}`} className="hover:text-club-primary">
                        {product.nameEn}
                      </Link>
                    </h2>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                      {product.descriptionEn}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-mono font-black text-xl text-club-primary">
                        {formatKes(product.priceKesCents)}
                      </span>
                      <select
                        aria-label={`Select size for ${product.nameEn}`}
                        value={activeVarId}
                        onChange={(e) =>
                          setSelectedVariantByProduct((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
                      >
                        {product.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            Size {v.size} ({v.availableStock} left)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={!activeVar || activeVar.availableStock <= 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-club-primary disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                  <Link
                    href={`/shop/${product.slug}`}
                    className="px-3 py-2.5 rounded-lg border border-slate-300 hover:border-slate-900 text-xs font-bold text-slate-700"
                  >
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Right 4 Cols: Shopping Cart, Embu Collection / Delivery & M-Pesa Checkout */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5 sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="editorial-headline font-bold text-xl text-slate-900">
              Official Store Cart &amp; Checkout
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-club-primary text-white text-xs font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {cart.length > 0 ? (
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-slate-500">
                        {item.variantLabel} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {formatKes(multiplyMoneyCents(item.unitPriceKesCents, item.quantity))}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCart((prev) => prev.filter((x) => x.variantId !== item.variantId))
                        }
                        className="text-red-600 hover:text-red-800 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery or Embu Collection Choice */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Collection in Embu or Courier Delivery
                </label>
                <select
                  value={deliveryCode}
                  onChange={(e) => setDeliveryCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"
                >
                  {deliveryOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.nameEn} ({opt.feeKesCents === 0 ? 'FREE' : formatKes(opt.feeKesCents)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="M-Pesa Phone (07XXXXXXXX)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                />
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Delivery Address or Embu Collection Note"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              {/* Server-Calculated Totals */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Merchandise Subtotal:</span>
                  <span className="font-mono">{formatKes(cartSubtotalCents)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Server Delivery Fee:</span>
                  <span className="font-mono">{formatKes(deliveryFeeCents)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-club-accent pt-1.5 border-t border-white/10">
                  <span>Total Payable (KES):</span>
                  <span className="font-mono">{formatKes(cartTotalCents)}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-800">
                  {checkoutError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-club-primary hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>{submitting ? 'Processing...' : 'Complete Order with M-Pesa'}</span>
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              Select an authentic 3K FC jersey, scarf, or training top to begin checkout.
            </p>
          )}

          {orderPaymentState && (
            <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-3 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-club-accent">
                  {orderPaymentState.orderNumber}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold uppercase">
                  {orderPaymentState.status}
                </span>
              </div>
              {orderPaymentState.status === 'PENDING' &&
                orderPaymentState.environment === 'sandbox' && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sandbox Callback Verification</span>
                    </div>
                    <button
                      type="button"
                      onClick={confirmSandboxStorePayment}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Verify Sandbox M-Pesa Payment (ResultCode 0)
                    </button>
                  </div>
                )}
              {orderPaymentState.status === 'SUCCESS' && (
                <div className="text-emerald-300 font-semibold">
                  Order Paid &amp; Stock Committed! Track fulfilment in your Fan Account.
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Truck className="w-4 h-4 text-club-primary shrink-0" />
            <span>Free collection in Embu Town or insured nationwide courier delivery.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
