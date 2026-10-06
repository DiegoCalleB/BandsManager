import React from 'react';
import {
  Mic, Megaphone, Drum, Guitar, Wrench, MessageCircle, Pause, Bomb, Pin, Zap, Circle,
  Target, AlertTriangle, Lightbulb, Star, Music, Music2, MapPin, Flame, Landmark, Disc3, Tent,
  Briefcase, Sparkles, User, Users, Smartphone, Calendar, Timer, PenLine, Truck, Handshake,
  RefreshCw, Radio, Clapperboard, SlidersHorizontal, FileText, Lock, ClipboardList, Hourglass,
  Car, Search, X, Gift, Tv, Clock, Settings, Ticket, Headphones, Shuffle, Rocket, Mail,
  AlarmClock, Undo2, Tag, CheckCircle2, Check, Trophy, Globe, Camera, Video, Image, Link2,
  Coins, Heart, Eye, Upload, Download, Play, ArrowRight, Info, Bell, Share2, TrendingUp, Crown,
  Brain, Phone, Building2, Scissors, Footprints, ArrowUpRight, Activity, SlidersVertical, Save, DoorOpen,
  Inbox, Pencil, Shield, HelpCircle, Trash2, BarChart3, Folder, FlaskConical, RefreshCcw, Leaf, Bird,
  FolderOpen, Package, Moon, Plus, Hand, BedDouble, ChevronLeft, Square, Ruler, Satellite, Umbrella,
  Drama, CloudSun, Snowflake, Bot, ScrollText, Coffee, Palette, ArrowLeft, KeyRound, Sprout, Armchair,
  Wand2, BookOpen, Music4, Wind,
  type LucideIcon,
} from 'lucide-react';

/**
 * Tabla única emoji → icono. La interfaz no pinta emojis (craft-interfaces §6): los que
 * llegan en textos, datos guardados o semillas se traducen aquí a Lucide, con el mismo
 * trazo que el resto. Los círculos de color (🔴🟢🟡) son estados: se pintan como un punto
 * con el token de estado. Un emoji sin entrada NO se pinta (mejor nada que un emoji suelto).
 */
const ICONOS: Record<string, LucideIcon> = {
  '🎤': Mic, '🎙': Mic, '🗣': Megaphone, '🥁': Drum, '🎸': Guitar, '🔧': Wrench, '💬': MessageCircle,
  '⏸': Pause, '💣': Bomb, '📌': Pin, '⚡': Zap, '🎯': Target, '⚠': AlertTriangle, '💡': Lightbulb,
  '⭐': Star, '🌟': Sparkles, '✨': Sparkles, '🎆': Sparkles, '🪩': Sparkles, '👏': Sparkles,
  '🎵': Music, '🎶': Music, '🎼': Music2, '📍': MapPin, '🔥': Flame, '🏛': Landmark, '💿': Disc3,
  '🎪': Tent, '💼': Briefcase, '👔': Briefcase, '👤': User, '👥': Users, '📱': Smartphone, '📅': Calendar,
  '⏱': Timer, '⏳': Hourglass, '🕒': Clock, '⏰': AlarmClock, '📝': PenLine, '🚐': Truck, '🚗': Car,
  '🤝': Handshake, '🔄': RefreshCw, '📻': Radio, '🎬': Clapperboard, '🎛': SlidersHorizontal,
  '📄': FileText, '📋': ClipboardList, '🔒': Lock, '🔍': Search, '❌': X, '🎁': Gift, '📺': Tv,
  '⚙': Settings, '🎟': Ticket, '🎧': Headphones, '🔀': Shuffle, '🚀': Rocket, '✉': Mail, '↩': Undo2,
  '🏷': Tag, '✅': CheckCircle2, '✔': Check, '✓': Check, '🏆': Trophy, '🌍': Globe, '🌐': Globe,
  '📸': Camera, '📷': Camera, '🎥': Video, '🖼': Image, '🔗': Link2, '💰': Coins, '💶': Coins, '💵': Coins,
  '❤': Heart, '👁': Eye, '⬆': Upload, '📤': Upload, '⬇': Download, '📥': Download, '▶': Play, '➡': ArrowRight,
  'ℹ': Info, '🔔': Bell, '📣': Megaphone, '📢': Megaphone, '🔊': Megaphone, '📈': TrendingUp, '👑': Crown, '⭕': Circle,
  '🧠': Brain, '☎': Phone, '📞': Phone, '🏢': Building2, '✂': Scissors, '🦶': Footprints, '↗': ArrowUpRight,
  '〰': Activity, '🎚': SlidersVertical, '💾': Save, '🚪': DoorOpen, '📬': Inbox, '✏': Pencil, '🛡': Shield,
  '❓': HelpCircle, '🗑': Trash2, '📊': BarChart3, '👉': ArrowRight, '👈': ArrowLeft, '👆': ArrowUpRight,
  '📁': Folder, '📂': FolderOpen, '🧪': FlaskConical, '🔁': RefreshCcw, '🎺': Music4, '🌿': Leaf, '🕊': Bird,
  '📦': Package, '🌙': Moon, '➕': Plus, '✋': Hand, '😴': BedDouble, '◀': ChevronLeft, '⏹': Square,
  '📐': Ruler, '🛰': Satellite, '🏖': Umbrella, '🎭': Drama, '🌤': CloudSun, '❄': Snowflake, '🏟': Landmark,
  '🤖': Bot, '🚛': Truck, '📧': Mail, '📜': ScrollText, '☕': Coffee, '📘': BookOpen, '📖': BookOpen,
  '🎨': Palette, '⬅': ArrowLeft, '🔐': KeyRound, '🌱': Sprout, '🪑': Armchair, '🧍': User, '🪄': Wand2,
  '🆕': Sparkles, '🔶': Circle, '⚪': Circle,
  '✎': Pencil, '✍': PenLine, '★': Star, '🏦': Landmark,
};
const PUNTOS: Record<string, string> = { '🔴': 'bg-[var(--alert)]', '🟢': 'bg-[var(--ok)]', '🟡': 'bg-[var(--acc)]', '🔵': 'bg-[var(--acc)]', '🟠': 'bg-[var(--acc)]' };

const limpiar = (e: string) => e.replace(/️/g, '').trim();

/** Ancho en texto corrido: escala con la fuente (1,05em) y deja aire antes del texto. */
const EN_LINEA = 'inline-block size-[1.05em] shrink-0 align-[-0.15em] mr-[0.4em]';

export function ShowIcon({
  emoji,
  className = 'size-4',
  inline = false,
}: {
  emoji?: React.ReactNode;
  className?: string;
  /** Icono dentro de un texto: hereda el tamaño de la letra. */
  inline?: boolean;
}) {
  // Si el dato ya es un nodo React (un icono propio), se respeta tal cual.
  if (emoji && typeof emoji !== 'string') return <>{emoji}</>;
  const k = limpiar((emoji as string) || '');
  const punto = PUNTOS[k];
  if (punto) {
    return <span aria-hidden="true" className={`${inline ? 'inline-block size-[0.6em] shrink-0 align-[0.05em] mr-[0.45em]' : 'size-2'} rounded-full ${punto}`} />;
  }
  const Icon = ICONOS[k] || (emoji ? null : Circle);
  if (!Icon) return null;
  return <Icon className={inline ? EN_LINEA : className} aria-hidden="true" />;
}
