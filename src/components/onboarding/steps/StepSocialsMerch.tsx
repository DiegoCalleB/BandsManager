import React from'react';
import { Globe, Instagram, Youtube, Music, Smartphone, ExternalLink, ShoppingBag } from'lucide-react';

interface StepSocialsMerchProps {
 socialLinks: {
 instagram: string;
 spotify: string;
 youtube: string;
 tiktok: string;
 website: string;
 whatsapp: string;
 };
 setSocialLinks: React.Dispatch<React.SetStateAction<{
 instagram: string;
 spotify: string;
 youtube: string;
 tiktok: string;
 website: string;
 whatsapp: string;
 }>>;
 merchStoreUrl: string;
 setMerchStoreUrl: (url: string) => void;
 merchHighlight: string;
 setMerchHighlight: (text: string) => void;
}

export const StepSocialsMerch: React.FC<StepSocialsMerchProps> = ({
 socialLinks,
 setSocialLinks,
 merchStoreUrl,
 setMerchStoreUrl,
 merchHighlight,
 setMerchHighlight,
}) => {
 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <Globe className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-[var(--ink)]">Redes Sociales, Web & Tienda Oficial (Merch)</h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Instagram */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
 <Instagram className="w-3.5 h-3.5 text-[var(--alert)]" />
 Instagram (Perfil o URL)
 </label>
 <input
 type="text"
 value={socialLinks.instagram}
 onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
 placeholder="https://instagram.com/tubanda o @tubanda"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>

 {/* Spotify */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
 <Music className="w-3.5 h-3.5 text-[var(--ok)]" />
 Spotify (Perfil de Artista)
 </label>
 <input
 type="text"
 value={socialLinks.spotify}
 onChange={(e) => setSocialLinks(prev => ({ ...prev, spotify: e.target.value }))}
 placeholder="https://open.spotify.com/artist/..."
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>

 {/* YouTube */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
 <Youtube className="w-3.5 h-3.5 text-[var(--alert)]" />
 Canal de YouTube
 </label>
 <input
 type="text"
 value={socialLinks.youtube}
 onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
 placeholder="https://youtube.com/@tubanda"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>

 {/* TikTok */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
 <Smartphone className="w-3.5 h-3.5 text-[var(--acc)]" />
 TikTok
 </label>
 <input
 type="text"
 value={socialLinks.tiktok}
 onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
 placeholder="https://tiktok.com/@tubanda"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>

 {/* Web Oficial */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
 <Globe className="w-3.5 h-3.5 text-[var(--acc)]" />
 Sitio Web Oficial / Linktree
 </label>
 <input
 type="text"
 value={socialLinks.website}
 onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
 placeholder="https://www.tubanda.com"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>

 {/* WhatsApp Contacto */}
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5 flex items-center gap-1.5">
 <ExternalLink className="w-3.5 h-3.5 text-[var(--ok)]" />
 WhatsApp de Contacto Directo
 </label>
 <input
 type="text"
 value={socialLinks.whatsapp}
 onChange={(e) => setSocialLinks(prev => ({ ...prev, whatsapp: e.target.value }))}
 placeholder="+34 600 000 000"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>
 </div>

 {/* Merchandising & Tienda Oficial */}
 <div className="pt-3 border-t border-[var(--hair)] space-y-3">
 <div className="flex items-center gap-2">
 <ShoppingBag className="w-4 h-4 text-[var(--acc)]" />
 <h4 className="text-xs font-semibold text-[var(--ink-2)] tracking-wider">
 Tienda de Merchandising & Productos Oficiales
 </h4>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
 Enlace a Tienda de Merch (Bandcamp, BigCartel, Tienda Online)
 </label>
 <input
 type="text"
 value={merchStoreUrl}
 onChange={(e) => setMerchStoreUrl(e.target.value)}
 placeholder="https://tubanda.bandcamp.com/merch"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
 Artículos Destacados en Directo
 </label>
 <input
 type="text"
 value={merchHighlight}
 onChange={(e) => setMerchHighlight(e.target.value)}
 placeholder="Ej. Vinilo Edición Limitada + Camisetas de Gira (15€)"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none focus:"
 />
 </div>
 </div>
 </div>
 </div>
 );
};
