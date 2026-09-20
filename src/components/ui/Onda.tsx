import React, { useMemo } from' react';

export interface OndaBar {
 label: string;
 value: number;
 color?: string;
}

export interface OndaProps {
 data: OndaBar[];
 height?: number;
 barWidth?: number;
 gap?: number;
 className?: string;
 showLabels?: boolean;
 animated?: boolean;
 tooltipFormatter?: (value: number) => string;
}

/**
 * Onda — BandManager's signature data visualization language
 * Vertical bars with rounded tops, inspired by the audio spectrum in the logo.
 * Per Espectro §2: this is the ONLY approved way to visualize time series and comparisons.
 *
 * Color palette:
 * - --acc: accomplished/confirmed state
 * - --ok: in-progress/pending state
 * - --alert: error/unavailable state
 * - --hair: inert/no-data state
 *
 * Rendered as SVG for precise control. No external chart libraries.
 */
export const Onda: React.FC<OndaProps> = ({
 data,
 height = 120,
 barWidth = 16,
 gap = 8,
 className =' ',
 showLabels = true,
 animated = true,
 tooltipFormatter = (v) => v.toString(),
}) => {
 const maxValue = useMemo(() => {
 return Math.max(...data.map(d => d.value), 1);
 }, [data]);

 const getTokenColor = (tokenName: string): string => {
 if (typeof document ===' undefined') return' #666666';
 const style = getComputedStyle(document.documentElement);
 return style.getPropertyValue(tokenName).trim() ||' #666666';
 };

 const barContainerStyle: React.CSSProperties = {
 display:' flex',
 gap: `${gap}px`,
 alignItems:' flex-end',
 justifyContent:' center',
 height: `${height}px`,
 padding: `0 ${gap}px`,
 };

 const barStyle = (bar: OndaBar): React.CSSProperties => {
 const barHeight = (bar.value / maxValue) * height;
 const color = bar.color || getTokenColor('--acc');

 return {
 width: `${barWidth}px`,
 height: `${barHeight}px`,
 backgroundColor: color,
 borderRadius:' 999px 999px 0 0',
 cursor:' pointer',
 transition: animated ?' height 0.3s ease-out, opacity 0.3s ease-out' :' none',
 opacity: 0.9,
 position:' relative',
 };
 };

 const labelStyle: React.CSSProperties = {
 fontSize:' 12px',
 color: getTokenColor('--ink-2'),
 textAlign:' center',
 marginTop:' 8px',
 maxWidth: `${barWidth}px`,
 overflow:' hidden',
 textOverflow:' ellipsis',
 whiteSpace:' nowrap',
 };

 return (
 <div className={className}>
 <div style={barContainerStyle}>
 {data.map((bar, index) => (
 <div
 key={`${bar.label}-${index}`}
 style={{ display:' flex', flexDirection:' column', alignItems:' center' }}
 >
 <div style={barStyle(bar)} title={`${bar.label}: ${tooltipFormatter(bar.value)}`} />
 {showLabels && <div style={labelStyle}>{bar.label}</div>}
 </div>
 ))}
 </div>
 </div>
 );
};

/**
 * OndaSeries — Multiple Onda charts stacked for complex data comparison
 * Shows multiple series on the same axes for side-by-side comparison
 * Each series gets its own color from module accent mapping
 */
export interface OndaSeriesProps {
 series: {
 label: string;
 data: OndaBar[];
 color?: string;
 }[];
 height?: number;
 barWidth?: number;
 gap?: number;
 className?: string;
 showLabels?: boolean;
}

export const OndaSeries: React.FC<OndaSeriesProps> = ({
 series,
 height = 120,
 barWidth = 12,
 gap = 4,
 className =' ',
 showLabels = true,
}) => {
 const allValues = series.flatMap(s => s.data.map(d => d.value));
 const maxValue = Math.max(...allValues, 1);

 const getTokenColor = (tokenName: string): string => {
 if (typeof document ===' undefined') return' #666666';
 const style = getComputedStyle(document.documentElement);
 return style.getPropertyValue(tokenName).trim() ||' #666666';
 };

 // Group bars by label (x-axis)
 const labels = series[0]?.data.map(d => d.label) || [];

 const barContainerStyle: React.CSSProperties = {
 display:' flex',
 gap: `${gap}px`,
 alignItems:' flex-end',
 justifyContent:' center',
 height: `${height}px`,
 padding: `0 ${gap}px`,
 };

 const barGroupStyle: React.CSSProperties = {
 display:' flex',
 gap: `${gap}px`,
 alignItems:' flex-end',
 };

 const barStyle = (value: number, color?: string): React.CSSProperties => {
 const barHeight = (value / maxValue) * height;
 const resolvedColor = color || getTokenColor('--acc');

 return {
 width: `${barWidth}px`,
 height: `${barHeight}px`,
 backgroundColor: resolvedColor,
 borderRadius:' 999px 999px 0 0',
 opacity: 0.85,
 transition:' height 0.3s ease-out, opacity 0.3s ease-out',
 };
 };

 return (
 <div className={className}>
 <div style={barContainerStyle}>
 {labels.map((label, labelIndex) => (
 <div key={`group-${label}`} style={barGroupStyle}>
 {series.map((s) => {
 const bar = s.data[labelIndex];
 const color = s.color || getTokenColor('--acc');
 return (
 <div key={`${s.label}-${label}`}>
 <div style={barStyle(bar?.value || 0, color)} />
 </div>
 );
 })}
 </div>
 ))}
 </div>
 {showLabels && (
 <div style={{ display:' flex', justifyContent:' center', gap: `${gap}px`, marginTop:' 12px', fontSize:' 12px' }}>
 {series.map((s) => (
 <div key={`legend-${s.label}`} style={{ display:' flex', alignItems:' center', gap:' 4px' }}>
 <div
 style={{
 width:' 12px',
 height:' 12px',
 backgroundColor: s.color || getTokenColor('--acc'),
 borderRadius:' 2px',
 }}
 />
 <span style={{ color: getTokenColor('--ink-2') }}>{s.label}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 );
};

export default Onda;
