// Personagens fixos (identidade do jogador). Cada um é um SVG desenhado em 200x200.
const eye = (x, y, r = 9, p = 4.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 1.5}" cy="${y + 1}" r="${p}" fill="#1c1233"/><circle cx="${x + 3}" cy="${y - 2}" r="${p / 3}" fill="#fff"/>`;

const CHARACTERS = [
  { name: 'Gatinho', bg: '#ffd9a8', svg: () => `
    <path d="M34 78 L40 18 L84 50Z M166 78 L160 18 L116 50Z" fill="#ff9f43"/><path d="M46 62 L48 34 L70 50Z M154 62 L152 34 L130 50Z" fill="#ffb6c1"/>
    <ellipse cx="100" cy="112" rx="68" ry="60" fill="#ff9f43"/><path d="M92 52 L100 78 L108 52Z M60 62 L72 84 L80 58Z M140 62 L128 84 L120 58Z" fill="#e8741a"/>
    <ellipse cx="100" cy="132" rx="30" ry="22" fill="#ffe6c7"/>${eye(72, 104)}${eye(128, 104)}
    <path d="M94 120 L106 120 L100 128Z" fill="#ff6b81"/><path d="M100 128 Q92 140 84 134 M100 128 Q108 140 116 134" stroke="#1c1233" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M40 120 L68 124 M40 134 L68 130 M160 120 L132 124 M160 134 L132 130" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` },
  { name: 'Ursinho', bg: '#e6c9a8', svg: () => `
    <circle cx="48" cy="52" r="26" fill="#9c6b3f"/><circle cx="152" cy="52" r="26" fill="#9c6b3f"/><circle cx="48" cy="52" r="14" fill="#d9a977"/><circle cx="152" cy="52" r="14" fill="#d9a977"/>
    <ellipse cx="100" cy="112" rx="70" ry="64" fill="#b07a49"/><ellipse cx="100" cy="132" rx="34" ry="26" fill="#ecd0aa"/>
    ${eye(72, 100, 8, 5)}${eye(128, 100, 8, 5)}<ellipse cx="100" cy="122" rx="12" ry="9" fill="#3b2314"/>
    <path d="M100 131 L100 140 M100 140 Q90 150 82 142 M100 140 Q110 150 118 142" stroke="#3b2314" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { name: 'Monstrinho', bg: '#d8c2ff', svg: () => `
    <path d="M50 54 L40 14 L76 42Z M150 54 L160 14 L124 42Z" fill="#ffbe0b"/>
    <path d="M30 120 Q22 50 100 40 Q178 50 170 120 Q176 172 142 168 L134 150 L116 170 L100 152 L84 170 L66 150 L58 168 Q24 172 30 120Z" fill="#9b5de5"/>
    <circle cx="70" cy="104" r="17" fill="#fff"/><circle cx="130" cy="96" r="22" fill="#fff"/><circle cx="73" cy="106" r="8" fill="#1c1233"/><circle cx="133" cy="98" r="11" fill="#1c1233"/><circle cx="136" cy="94" r="3.5" fill="#fff"/>
    <path d="M62 132 Q100 170 140 128Z" fill="#2a0f55"/><path d="M76 138 L84 150 L92 142 L100 154 L108 143 L116 150 L122 138Z" fill="#fff"/><circle cx="46" cy="130" r="7" fill="#c7a3ff"/><circle cx="158" cy="146" r="6" fill="#c7a3ff"/>` },
  { name: 'Caveira', bg: '#c7cbe0', svg: () => `
    <path d="M100 18 Q168 18 168 94 Q168 118 148 130 L148 160 Q148 172 136 172 L64 172 Q52 172 52 160 L52 130 Q32 118 32 94 Q32 18 100 18Z" fill="#f4f1ea" stroke="#d6d0c2" stroke-width="4"/>
    <ellipse cx="68" cy="98" rx="20" ry="24" fill="#1c1233"/><ellipse cx="132" cy="98" rx="20" ry="24" fill="#1c1233"/><circle cx="72" cy="94" r="5" fill="#ff4d6d"/><circle cx="136" cy="94" r="5" fill="#ff4d6d"/>
    <path d="M100 118 L90 140 L110 140Z" fill="#1c1233"/><path d="M70 156 L130 156" stroke="#1c1233" stroke-width="4"/><path d="M80 148 L80 168 M90 148 L90 168 M100 148 L100 168 M110 148 L110 168 M120 148 L120 168" stroke="#1c1233" stroke-width="3.5"/>` },
  { name: 'Cachorrinho', bg: '#ffe2b8', svg: () => `
    <path d="M44 50 Q8 56 20 128 Q40 132 58 96Z M156 50 Q192 56 180 128 Q160 132 142 96Z" fill="#7a4a24"/>
    <ellipse cx="100" cy="108" rx="62" ry="62" fill="#e8b27a"/><path d="M100 46 Q66 50 72 92 Q100 80 128 92 Q134 50 100 46Z" fill="#fff0dc"/>
    <ellipse cx="100" cy="134" rx="34" ry="26" fill="#fff0dc"/>${eye(74, 100, 8, 5)}${eye(126, 100, 8, 5)}
    <ellipse cx="100" cy="120" rx="15" ry="11" fill="#1c1233"/><circle cx="95" cy="116" r="3.5" fill="#fff" opacity=".7"/>
    <path d="M100 131 L100 140 M100 140 Q88 150 80 140 M100 140 Q112 150 120 140" stroke="#1c1233" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M92 146 Q100 172 110 146Z" fill="#ff6b81"/>` },
  { name: 'Panda', bg: '#d4f1de', svg: () => `
    <circle cx="48" cy="48" r="26" fill="#222"/><circle cx="152" cy="48" r="26" fill="#222"/>
    <ellipse cx="100" cy="110" rx="70" ry="64" fill="#fff"/>
    <ellipse cx="70" cy="102" rx="19" ry="25" fill="#222" transform="rotate(20 70 102)"/><ellipse cx="130" cy="102" rx="19" ry="25" fill="#222" transform="rotate(-20 130 102)"/>
    <circle cx="72" cy="102" r="8" fill="#fff"/><circle cx="128" cy="102" r="8" fill="#fff"/><circle cx="73" cy="103" r="4.5" fill="#1c1233"/><circle cx="127" cy="103" r="4.5" fill="#1c1233"/>
    <ellipse cx="100" cy="128" rx="12" ry="8" fill="#222"/><path d="M100 136 Q88 150 78 140 M100 136 Q112 150 122 140" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { name: 'Robô', bg: '#cfe3ff', svg: () => `
    <rect x="96" y="14" width="8" height="26" fill="#8d99ae"/><circle cx="100" cy="14" r="10" fill="#ff4d6d"/>
    <rect x="22" y="84" width="14" height="40" rx="6" fill="#8d99ae"/><rect x="164" y="84" width="14" height="40" rx="6" fill="#8d99ae"/>
    <rect x="34" y="40" width="132" height="118" rx="28" fill="#c8d3e6" stroke="#8d99ae" stroke-width="5"/>
    <rect x="48" y="62" width="104" height="48" rx="16" fill="#1c2a4a"/><circle cx="76" cy="86" r="13" fill="#06d6a0"/><circle cx="124" cy="86" r="13" fill="#06d6a0"/><circle cx="80" cy="82" r="4" fill="#fff"/><circle cx="128" cy="82" r="4" fill="#fff"/>
    <rect x="62" y="124" width="76" height="22" rx="8" fill="#1c2a4a"/><path d="M76 124 V146 M90 124 V146 M104 124 V146 M118 124 V146 M132 124 V146" stroke="#8d99ae" stroke-width="3"/>` },
  { name: 'Alienígena', bg: '#c4f5d2', svg: () => `
    <path d="M70 40 Q60 14 44 12 M130 40 Q140 14 156 12" stroke="#2fbf71" stroke-width="5" fill="none"/><circle cx="44" cy="12" r="8" fill="#ffbe0b"/><circle cx="156" cy="12" r="8" fill="#ffbe0b"/>
    <path d="M100 36 Q172 36 168 104 Q162 168 100 174 Q38 168 32 104 Q28 36 100 36Z" fill="#5ee69a"/>
    <path d="M42 88 Q60 78 86 108 Q66 132 46 112Z" fill="#12232e"/><path d="M158 88 Q140 78 114 108 Q134 132 154 112Z" fill="#12232e"/>
    <ellipse cx="62" cy="98" rx="5" ry="8" fill="#fff" opacity=".7" transform="rotate(30 62 98)"/><ellipse cx="138" cy="98" rx="5" ry="8" fill="#fff" opacity=".7" transform="rotate(-30 138 98)"/>
    <circle cx="94" cy="134" r="2.5" fill="#2fbf71"/><circle cx="106" cy="134" r="2.5" fill="#2fbf71"/><path d="M84 148 Q100 158 116 148" stroke="#12232e" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { name: 'Coelhinho', bg: '#ffd6e8', svg: () => `
    <ellipse cx="68" cy="40" rx="18" ry="46" fill="#fff" stroke="#f1d5e0" stroke-width="3"/><ellipse cx="132" cy="40" rx="18" ry="46" fill="#fff" stroke="#f1d5e0" stroke-width="3"/>
    <ellipse cx="68" cy="44" rx="9" ry="32" fill="#ffb3cf"/><ellipse cx="132" cy="44" rx="9" ry="32" fill="#ffb3cf"/>
    <ellipse cx="100" cy="124" rx="66" ry="56" fill="#fff" stroke="#f1d5e0" stroke-width="3"/><circle cx="58" cy="132" r="10" fill="#ffb3cf" opacity=".6"/><circle cx="142" cy="132" r="10" fill="#ffb3cf" opacity=".6"/>
    ${eye(74, 114, 8, 5)}${eye(126, 114, 8, 5)}<path d="M94 126 L106 126 L100 134Z" fill="#ff6b81"/>
    <path d="M100 134 Q92 146 84 140 M100 134 Q108 146 116 140" stroke="#1c1233" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="93" y="144" width="14" height="14" rx="3" fill="#fff" stroke="#e5d0d9" stroke-width="2"/>` },
  { name: 'Raposa', bg: '#ffd0a6', svg: () => `
    <path d="M26 86 L34 14 L88 52Z M174 86 L166 14 L112 52Z" fill="#f2711c"/><path d="M42 62 L44 34 L68 50Z M158 62 L156 34 L132 50Z" fill="#2b1b12"/>
    <path d="M100 168 Q20 150 28 88 Q60 50 100 62 Q140 50 172 88 Q180 150 100 168Z" fill="#f2711c"/>
    <path d="M28 104 Q60 112 100 160 Q60 160 38 140Z M172 104 Q140 112 100 160 Q140 160 162 140Z" fill="#fff"/>
    ${eye(72, 98, 8, 5)}${eye(128, 98, 8, 5)}<ellipse cx="100" cy="150" rx="11" ry="8" fill="#1c1233"/>` },
  { name: 'Pinguim', bg: '#cfeaff', svg: () => `
    <ellipse cx="100" cy="110" rx="66" ry="72" fill="#1f2a44"/><ellipse cx="100" cy="128" rx="46" ry="54" fill="#fff"/>
    <ellipse cx="100" cy="82" rx="42" ry="30" fill="#fff"/>${eye(80, 84, 9, 5)}${eye(120, 84, 9, 5)}
    <path d="M84 100 Q100 90 116 100 Q100 122 84 100Z" fill="#ffa62b"/><path d="M60 170 Q70 186 90 176Z M140 170 Q130 186 110 176Z" fill="#ffa62b"/>
    <circle cx="66" cy="102" r="7" fill="#ff8fa3" opacity=".6"/><circle cx="134" cy="102" r="7" fill="#ff8fa3" opacity=".6"/>` },
  { name: 'Sapinho', bg: '#d1f7c4', svg: () => `
    <circle cx="62" cy="52" r="26" fill="#6ddc4a"/><circle cx="138" cy="52" r="26" fill="#6ddc4a"/><circle cx="62" cy="52" r="17" fill="#fff"/><circle cx="138" cy="52" r="17" fill="#fff"/>
    <circle cx="64" cy="54" r="8" fill="#1c1233"/><circle cx="136" cy="54" r="8" fill="#1c1233"/>
    <ellipse cx="100" cy="116" rx="74" ry="56" fill="#6ddc4a"/><ellipse cx="100" cy="138" rx="52" ry="26" fill="#b4f08e"/>
    <path d="M52 124 Q100 168 148 124" stroke="#1c1233" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="90" cy="100" r="3" fill="#2a8a14"/><circle cx="110" cy="100" r="3" fill="#2a8a14"/>
    <circle cx="48" cy="130" r="9" fill="#ff8fa3" opacity=".6"/><circle cx="152" cy="130" r="9" fill="#ff8fa3" opacity=".6"/>` },
  { name: 'Fantasminha', bg: '#e1d9ff', svg: () => `
    <path d="M32 100 Q32 22 100 22 Q168 22 168 100 L168 172 L146 154 L124 174 L100 154 L76 174 L54 154 L32 172Z" fill="#fff" stroke="#d2c8f5" stroke-width="4"/>
    ${eye(76, 94, 11, 6.5)}${eye(124, 94, 11, 6.5)}<ellipse cx="100" cy="128" rx="12" ry="15" fill="#1c1233"/><circle cx="56" cy="118" r="9" fill="#ffb3cf" opacity=".7"/><circle cx="144" cy="118" r="9" fill="#ffb3cf" opacity=".7"/>` },
  { name: 'Leãozinho', bg: '#ffe7a3', svg: () => `
    <circle cx="100" cy="106" r="78" fill="#b8651b"/><circle cx="46" cy="52" r="20" fill="#e9a23b"/><circle cx="154" cy="52" r="20" fill="#e9a23b"/>
    <circle cx="100" cy="112" r="56" fill="#f6bf4f"/><ellipse cx="100" cy="132" rx="30" ry="22" fill="#fff0c9"/>
    ${eye(76, 100, 8, 5)}${eye(124, 100, 8, 5)}<path d="M92 118 L108 118 L100 128Z" fill="#7a3b10"/>
    <path d="M100 128 Q90 142 82 134 M100 128 Q110 142 118 134" stroke="#7a3b10" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { name: 'Unicórnio', bg: '#ffd6f4', svg: () => `
    <path d="M100 4 L88 46 L112 46Z" fill="#ffd23f" stroke="#e09f00" stroke-width="2"/><path d="M60 54 L50 20 L84 44Z M140 54 L150 20 L116 44Z" fill="#fff"/>
    <path d="M40 60 Q10 100 34 150 Q44 110 62 80Z" fill="#ff6bd6"/><path d="M160 60 Q190 100 166 150 Q156 110 138 80Z" fill="#8f6bff"/>
    <ellipse cx="100" cy="116" rx="60" ry="58" fill="#fff"/><path d="M62 70 Q100 40 138 70 Q100 62 62 70Z" fill="#6bd1ff"/>
    ${eye(76, 108, 8, 5)}${eye(124, 108, 8, 5)}<ellipse cx="100" cy="140" rx="30" ry="20" fill="#ffe3f1"/><circle cx="90" cy="140" r="3.5" fill="#d96aa8"/><circle cx="110" cy="140" r="3.5" fill="#d96aa8"/>
    <path d="M90 152 Q100 160 110 152" stroke="#1c1233" stroke-width="3.5" fill="none" stroke-linecap="round"/>` },
  { name: 'Viking', bg: '#c9d6e8', svg: () => `
    <path d="M44 104 Q38 40 100 38 Q162 40 156 104Z" fill="#d9731a"/><circle cx="44" cy="136" r="9" fill="#d9731a"/><circle cx="156" cy="136" r="9" fill="#d9731a"/>
    <ellipse cx="100" cy="104" rx="54" ry="58" fill="#f4c7a1"/>
    <path d="M48 86 Q58 46 100 48 Q142 46 152 86 Q130 66 100 70 Q70 66 48 86Z" fill="#d9731a"/>
    <path d="M62 92 L90 97 M138 92 L110 97" stroke="#8a3f0c" stroke-width="7" stroke-linecap="round"/>
    <circle cx="76" cy="105" r="5.5" fill="#1c1233"/><circle cx="124" cy="105" r="5.5" fill="#1c1233"/><circle cx="78" cy="103" r="1.8" fill="#fff"/><circle cx="126" cy="103" r="1.8" fill="#fff"/>
    <path d="M100 106 Q93 122 102 124" stroke="#d99a72" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M46 114 Q48 178 100 188 Q152 178 154 114 Q142 142 100 140 Q58 142 46 114Z" fill="#d9731a"/>
    <path d="M74 136 Q100 126 126 136 Q100 144 74 136Z" fill="#b95d12"/><path d="M90 150 Q100 156 110 150" stroke="#6a2e08" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { name: 'Ninja', bg: '#c5c9de', svg: () => `
    <path d="M158 80 L188 68 L180 86 L194 98 L158 94Z" fill="#e63946"/>
    <ellipse cx="100" cy="106" rx="60" ry="62" fill="#2b3350"/><rect x="50" y="84" width="100" height="40" rx="18" fill="#f1c6a0"/>
    <ellipse cx="76" cy="104" rx="11" ry="8" fill="#fff"/><ellipse cx="124" cy="104" rx="11" ry="8" fill="#fff"/><circle cx="78" cy="105" r="5" fill="#111"/><circle cx="122" cy="105" r="5" fill="#111"/>
    <path d="M60 88 L92 99 M140 88 L108 99" stroke="#111" stroke-width="8" stroke-linecap="round"/>
    <path d="M40 76 Q100 54 160 76 L160 92 Q100 72 40 92Z" fill="#e63946"/><rect x="84" y="64" width="32" height="16" rx="4" fill="#cfd8dc" stroke="#90a4ae" stroke-width="2"/><path d="M96 72 L104 72" stroke="#607d8b" stroke-width="3"/>
    <path d="M62 138 Q100 152 138 138" stroke="#1b2038" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  { name: 'Astronauta', bg: '#b9c6ee', svg: () => `
    <ellipse cx="100" cy="176" rx="48" ry="13" fill="#c9d1de"/><rect x="62" y="150" width="76" height="26" rx="10" fill="#e5eaf2"/>
    <circle cx="100" cy="100" r="72" fill="#f1f4f9" stroke="#c9d1de" stroke-width="5"/>
    <ellipse cx="100" cy="104" rx="54" ry="46" fill="#17224a" stroke="#8fa2d6" stroke-width="3"/>
    <path d="M60 90 Q72 66 102 64 Q82 80 76 106Z" fill="#fff" opacity=".5"/><circle cx="134" cy="130" r="6" fill="#fff" opacity=".3"/>
    <circle cx="84" cy="104" r="6" fill="#9fe0ff"/><circle cx="116" cy="104" r="6" fill="#9fe0ff"/><path d="M86 122 Q100 134 114 122" stroke="#9fe0ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="38" cy="100" r="9" fill="#ff4d6d"/><circle cx="162" cy="100" r="9" fill="#06d6a0"/>` },
  { name: 'Pirata', bg: '#c8d3d9', svg: () => `
    <path d="M44 104 Q40 44 100 42 Q160 44 156 104Z" fill="#1c1c24"/>
    <ellipse cx="100" cy="106" rx="52" ry="56" fill="#e0a370"/>
    <path d="M50 86 Q60 48 100 50 Q140 48 150 86 Q126 64 100 68 Q74 64 50 86Z" fill="#1c1c24"/>
    <path d="M50 82 L150 112" stroke="#111" stroke-width="4"/><ellipse cx="76" cy="98" rx="16" ry="13" fill="#111"/>
    <ellipse cx="124" cy="104" rx="10" ry="8" fill="#fff"/><circle cx="125" cy="105" r="5" fill="#1c1233"/><path d="M110 90 L140 98" stroke="#1c1c24" stroke-width="7" stroke-linecap="round"/>
    <path d="M122 80 L136 120" stroke="#c4574e" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M52 122 Q60 170 100 172 Q140 170 148 122 Q130 148 100 146 Q70 148 52 122Z" fill="#3a2a22"/>
    <path d="M82 142 Q104 154 124 138" stroke="#f4e8d8" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="108" y="144" width="6" height="7" fill="#ffc400"/>
    <circle cx="49" cy="122" r="6" fill="none" stroke="#ffc400" stroke-width="3"/>` },
  { name: 'Lobo', bg: '#cfd8e3', svg: () => `
    <path d="M38 96 L44 22 L94 60Z M162 96 L156 22 L106 60Z" fill="#69778a"/><path d="M52 76 L54 42 L78 60Z M148 76 L146 42 L122 60Z" fill="#3b4652"/>
    <path d="M100 178 Q26 162 32 96 Q50 52 100 56 Q150 52 168 96 Q174 162 100 178Z" fill="#8795a5"/>
    <path d="M68 118 Q100 98 132 118 Q136 164 100 176 Q64 164 68 118Z" fill="#dce3ea"/>
    <ellipse cx="72" cy="104" rx="12" ry="8" fill="#ffd23f" transform="rotate(14 72 104)"/><ellipse cx="128" cy="104" rx="12" ry="8" fill="#ffd23f" transform="rotate(-14 128 104)"/>
    <circle cx="74" cy="105" r="4" fill="#111"/><circle cx="126" cy="105" r="4" fill="#111"/>
    <path d="M52 86 L90 99 M148 86 L110 99" stroke="#2d3640" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="100" cy="128" rx="13" ry="9" fill="#1c1c24"/><path d="M100 137 L100 146 M78 150 Q100 164 122 150" stroke="#1c1c24" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M86 152 L91 166 L97 156Z M114 152 L109 166 L103 156Z" fill="#fff"/><path d="M46 112 L58 128 M44 124 L56 138" stroke="#c4574e" stroke-width="3" stroke-linecap="round"/>` },
  { name: 'Heroína', bg: '#e6d2ff', svg: () => `
    <path d="M38 112 Q30 38 100 34 Q170 38 162 112 L170 190 Q150 168 144 142 L56 142 Q50 168 30 190Z" fill="#5b2a86"/>
    <path d="M40 200 Q46 166 100 162 Q154 166 160 200Z" fill="#e63946"/><rect x="86" y="146" width="28" height="22" fill="#f4c7a1"/>
    <ellipse cx="100" cy="106" rx="50" ry="56" fill="#f6cfae"/>
    <path d="M50 94 Q54 46 100 44 Q146 46 150 94 Q142 66 110 64 Q92 84 50 94Z" fill="#5b2a86"/>
    <ellipse cx="78" cy="106" rx="10" ry="8" fill="#fff"/><ellipse cx="122" cy="106" rx="10" ry="8" fill="#fff"/><circle cx="79" cy="107" r="5" fill="#2b6b3a"/><circle cx="121" cy="107" r="5" fill="#2b6b3a"/><circle cx="80" cy="105" r="1.8" fill="#fff"/><circle cx="122" cy="105" r="1.8" fill="#fff"/>
    <path d="M66 100 L72 96 M134 100 L128 96" stroke="#1c1233" stroke-width="3" stroke-linecap="round"/><path d="M66 94 Q78 88 90 94 M110 94 Q122 88 134 94" stroke="#3a1a5a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="64" cy="126" r="8" fill="#ff8fa3" opacity=".45"/><circle cx="136" cy="126" r="8" fill="#ff8fa3" opacity=".45"/>
    <path d="M100 108 Q96 120 102 122" stroke="#d99a72" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M86 136 Q100 148 114 136 Q100 140 86 136Z" fill="#d6224a"/>` },
  { name: 'Ruiva', bg: '#cdeee6', svg: () => `
    <path d="M38 110 Q32 42 100 40 Q168 42 162 110 Q170 156 152 170 Q148 126 100 124 Q52 126 48 170 Q30 156 38 110Z" fill="#e8590c"/>
    <path d="M40 200 Q46 166 100 162 Q154 166 160 200Z" fill="#2a9d8f"/><rect x="86" y="146" width="28" height="22" fill="#fbd5b5"/>
    <ellipse cx="100" cy="108" rx="48" ry="54" fill="#fbd5b5"/>
    <path d="M52 98 Q56 52 100 52 Q144 52 148 98 Q124 70 100 82 Q76 70 52 98Z" fill="#e8590c"/>
    <ellipse cx="78" cy="108" rx="10" ry="8" fill="#fff"/><ellipse cx="122" cy="108" rx="10" ry="8" fill="#fff"/><circle cx="79" cy="109" r="5" fill="#1b7a52"/><circle cx="121" cy="109" r="5" fill="#1b7a52"/><circle cx="80" cy="107" r="1.8" fill="#fff"/><circle cx="122" cy="107" r="1.8" fill="#fff"/>
    <path d="M66 98 Q78 92 90 98 M110 98 Q122 92 134 98" stroke="#a63f08" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <g fill="#c9703a" opacity=".7"><circle cx="70" cy="124" r="2.2"/><circle cx="78" cy="128" r="2.2"/><circle cx="86" cy="124" r="2.2"/><circle cx="114" cy="124" r="2.2"/><circle cx="122" cy="128" r="2.2"/><circle cx="130" cy="124" r="2.2"/></g>
    <path d="M100 110 Q96 122 102 124" stroke="#d99a72" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M84 138 Q100 154 116 138 Q100 144 84 138Z" fill="#d6224a"/>` },
];

// Posição do chapéu em cada personagem: [y da aba do chapéu, largura]
const HATPOS = { Gatinho: [72, 92], Ursinho: [64, 98], Monstrinho: [64, 100], Caveira: [46, 100], Cachorrinho: [64, 90], Panda: [60, 104], Robô: [52, 104], Alienígena: [62, 92], Coelhinho: [86, 94], Raposa: [78, 100], Pinguim: [60, 78], Sapinho: [66, 86], Fantasminha: [48, 100], Leãozinho: [54, 100], Unicórnio: [76, 86], Viking: [60, 94], Ninja: [58, 98], Astronauta: [44, 92], Pirata: [58, 94], Lobo: [66, 86], Heroína: [58, 90], Ruiva: [60, 88], Camaleão: [72, 84], Coruja: [64, 80], Tigre: [66, 92], Elefante: [60, 82], Macaco: [62, 88], Dragão: [62, 88], Tubarão: [64, 84], Jacaré: [72, 72] };

// Chapéus: desenhados com a aba em y=0, largura ~100, crescendo para cima
const HATS = [
  { name: 'Sem chapéu', svg: '' },
  { name: 'Boné', svg: `<path d="M-42 4 Q-44 -44 0 -44 Q44 -44 42 4Z" fill="#e63946"/><path d="M-42 4 Q-44 -44 0 -44 Q-22 -30 -22 4Z" fill="#fff" opacity=".2"/><path d="M12 -2 Q62 -4 68 8 Q38 12 10 6Z" fill="#b5172a"/><rect x="-43" y="-5" width="86" height="9" rx="4" fill="#b5172a"/><circle cx="0" cy="-45" r="4" fill="#b5172a"/>` },
  { name: 'Cartola', svg: `<ellipse cx="0" cy="2" rx="50" ry="9" fill="#1d1d2b"/><rect x="-29" y="-60" width="58" height="62" rx="6" fill="#262637"/><rect x="-29" y="-18" width="58" height="12" fill="#e63946"/><rect x="-22" y="-56" width="8" height="38" rx="4" fill="#fff" opacity=".14"/>` },
  { name: 'Coroa', svg: `<path d="M-36 4 L-40 -40 L-18 -22 L0 -50 L18 -22 L40 -40 L36 4Z" fill="#ffc400" stroke="#c98f00" stroke-width="3" stroke-linejoin="round"/><rect x="-36" y="-6" width="72" height="10" fill="#e0a800"/><circle cx="0" cy="-26" r="5" fill="#ff4d6d"/><circle cx="-22" cy="-12" r="3.5" fill="#3a86ff"/><circle cx="22" cy="-12" r="3.5" fill="#06d6a0"/>` },
  { name: 'Gorro', svg: `<path d="M-44 6 Q-46 -48 0 -50 Q46 -48 44 6Z" fill="#2fa8ff"/><rect x="-46" y="-14" width="92" height="20" rx="10" fill="#1478c9"/><path d="M-30 -14 V6 M-15 -14 V6 M0 -14 V6 M15 -14 V6 M30 -14 V6" stroke="#0e5a9c" stroke-width="3"/><circle cx="0" cy="-54" r="9" fill="#fff"/>` },
  { name: 'Cowboy', svg: `<ellipse cx="0" cy="2" rx="62" ry="11" fill="#8a5a2b"/><path d="M-34 2 Q-40 -40 -18 -38 Q0 -26 18 -38 Q40 -40 34 2Z" fill="#a8703a"/><rect x="-34" y="-12" width="68" height="9" fill="#5c3a1a"/><rect x="-6" y="-13" width="12" height="11" rx="2" fill="#ffc400"/>` },
  { name: 'Capacete', svg: `<path d="M-44 4 Q-46 -46 0 -46 Q46 -46 44 4Z" fill="#ffc400"/><rect x="-6" y="-48" width="12" height="42" rx="4" fill="#e0a800"/><rect x="-50" y="-4" width="100" height="10" rx="5" fill="#e0a800"/><path d="M-32 -12 Q-30 -32 -16 -38" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>` },
  { name: 'Festa', svg: `<path d="M-28 6 L0 -72 L28 6Z" fill="#9b5de5"/><path d="M-20 -20 L20 -20 M-12 -42 L12 -42" stroke="#ffd23f" stroke-width="7"/><circle cx="-10" cy="-6" r="4" fill="#ff4d6d"/><circle cx="10" cy="-31" r="4" fill="#06d6a0"/><circle cx="0" cy="-74" r="8" fill="#ff4d6d"/>` },
  { name: 'Boina', svg: `<ellipse cx="-4" cy="-8" rx="48" ry="20" fill="#2a2d6b"/><path d="M-30 -18 Q-6 -26 20 -18" stroke="#fff" stroke-width="3" fill="none" opacity=".2"/><rect x="-1" y="-34" width="6" height="10" rx="3" fill="#1a1c4a"/><rect x="-44" y="-2" width="88" height="8" rx="4" fill="#1a1c4a"/>` },
  { name: 'Bruxo', svg: `<ellipse cx="0" cy="3" rx="58" ry="10" fill="#3b2a6b"/><path d="M-32 2 Q-20 -30 -6 -50 Q10 -68 36 -62 Q16 -56 14 -40 Q22 -20 32 2Z" fill="#4b3790"/><rect x="-32" y="-14" width="64" height="9" fill="#ffd23f"/>` },
  { name: 'Viking', svg: `<path d="M-42 6 Q-44 -42 0 -42 Q44 -42 42 6Z" fill="#9aa5b1"/><path d="M-30 -12 Q-28 -32 -14 -36" stroke="#fff" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/><rect x="-44" y="-6" width="88" height="11" rx="5" fill="#6b7682"/><path d="M-40 -8 Q-72 -12 -66 -52 Q-50 -26 -36 -26Z" fill="#f4ecd8" stroke="#cdbf9c" stroke-width="2"/><path d="M40 -8 Q72 -12 66 -52 Q50 -26 36 -26Z" fill="#f4ecd8" stroke="#cdbf9c" stroke-width="2"/>` },
];

// Âncora dos olhos de cada personagem: [y dos olhos, metade da distância entre os olhos]
// É esse "código" que encaixa os óculos certinho em cada personagem.
const EYEPOS = { Gatinho: [104, 28], Ursinho: [100, 28], Monstrinho: [100, 30], Caveira: [98, 32], Cachorrinho: [100, 26], Panda: [102, 30], Robô: [86, 24], Alienígena: [98, 38], Coelhinho: [114, 26], Raposa: [98, 28], Pinguim: [84, 20], Sapinho: [54, 36], Fantasminha: [94, 24], Leãozinho: [100, 24], Unicórnio: [108, 24], Viking: [105, 24], Ninja: [104, 24], Astronauta: [104, 17], Pirata: [101, 25], Lobo: [104, 28], Heroína: [106, 22], Ruiva: [108, 22], Camaleão: [86, 40], Coruja: [102, 30], Tigre: [102, 26], Elefante: [94, 22], Macaco: [104, 22], Dragão: [100, 26], Tubarão: [96, 34], Jacaré: [74, 36] };

// Óculos: olhos em (-28,0) e (28,0), ponte no meio. Escalam pela distância dos olhos do personagem.
const GLASSES = [
  { name: 'Sem óculos', svg: '' },
  { name: 'Redondo', svg: `<g fill="rgba(180,220,255,.28)" stroke="#222" stroke-width="4"><circle cx="-28" cy="0" r="16"/><circle cx="28" cy="0" r="16"/></g><path d="M-12 -2 Q0 -8 12 -2" stroke="#222" stroke-width="4" fill="none"/><path d="M-44 -2 L-52 -6 M44 -2 L52 -6" stroke="#222" stroke-width="4" stroke-linecap="round"/>` },
  { name: 'Escuros', svg: `<path d="M-48 -10 L-8 -10 Q-6 14 -26 16 Q-46 16 -48 -10Z M48 -10 L8 -10 Q6 14 26 16 Q46 16 48 -10Z" fill="#111"/><path d="M-8 -8 Q0 -12 8 -8" stroke="#111" stroke-width="5" fill="none"/><path d="M-40 -6 L-26 -6 M18 -6 L32 -6" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/><path d="M-48 -8 L-54 -10 M48 -8 L54 -10" stroke="#111" stroke-width="4" stroke-linecap="round"/>` },
  { name: 'Nerd', svg: `<g fill="rgba(180,220,255,.25)" stroke="#5a3a22" stroke-width="4.5"><rect x="-46" y="-13" width="36" height="26" rx="6"/><rect x="10" y="-13" width="36" height="26" rx="6"/></g><path d="M-10 -4 L10 -4" stroke="#5a3a22" stroke-width="4"/><path d="M-46 -6 L-54 -8 M46 -6 L54 -8" stroke="#5a3a22" stroke-width="4" stroke-linecap="round"/>` },
  { name: 'Coração', svg: `<g fill="#ff4d8d" stroke="#c4175f" stroke-width="3" stroke-linejoin="round"><path d="M-28 16 L-44 -2 Q-50 -16 -36 -16 Q-28 -16 -28 -8 Q-28 -16 -20 -16 Q-6 -16 -12 -2Z"/><path d="M28 16 L12 -2 Q6 -16 20 -16 Q28 -16 28 -8 Q28 -16 36 -16 Q50 -16 44 -2Z"/></g><path d="M-14 -8 Q0 -14 14 -8" stroke="#c4175f" stroke-width="4" fill="none"/><path d="M-36 -10 L-30 -10" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>` },
  { name: 'Estrela', svg: `<g fill="#ffd23f" stroke="#e09f00" stroke-width="3" stroke-linejoin="round"><path d="M-28 -20 L-22 -6 L-6 -5 L-18 5 L-14 20 L-28 12 L-42 20 L-38 5 L-50 -5 L-34 -6Z"/><path d="M28 -20 L34 -6 L50 -5 L38 5 L42 20 L28 12 L14 20 L18 5 L6 -5 L22 -6Z"/></g><path d="M-8 -4 L8 -4" stroke="#e09f00" stroke-width="4"/>` },
  { name: 'Aviador', svg: `<g stroke="#d9a400" stroke-width="3.5" fill="rgba(40,40,60,.8)"><path d="M-48 -12 Q-10 -16 -10 -2 Q-10 20 -30 20 Q-50 18 -48 -12Z"/><path d="M48 -12 Q10 -16 10 -2 Q10 20 30 20 Q50 18 48 -12Z"/></g><path d="M-10 -6 Q0 -12 10 -6" stroke="#d9a400" stroke-width="3.5" fill="none"/><path d="M-40 -6 Q-32 -8 -24 -4" stroke="#fff" stroke-width="3" opacity=".45" fill="none" stroke-linecap="round"/>` },
  { name: 'Visor', svg: `<rect x="-54" y="-14" width="108" height="28" rx="14" fill="#0b1b3a" stroke="#18c8ff" stroke-width="3.5"/><rect x="-46" y="-6" width="92" height="12" rx="6" fill="#18c8ff" opacity=".9"/><rect x="-38" y="-4" width="30" height="3" rx="1.5" fill="#fff" opacity=".7"/>` },
];

function randomAvatar() { return { id: Math.floor(Math.random() * CHARACTERS.length), hat: 0, glasses: 0 }; }
function defaultAvatar() { return { id: 0, hat: 0, glasses: 0 }; }

// Camadas: personagem → óculos → chapéu. Cada uma usa a âncora do personagem (EYEPOS / HATPOS).
function avatarSVG(a, size = 120) {
  const id = ((a && a.id) || 0) % CHARACTERS.length;
  const c = CHARACTERS[id];
  const hi = ((a && a.hat) || 0) % HATS.length;
  const gi = ((a && a.glasses) || 0) % GLASSES.length;
  const [hy, hw] = HATPOS[c.name] || [60, 90];
  const [ey, eh] = EYEPOS[c.name] || [100, 26];
  const hat = hi ? `<g transform="translate(100 ${hy}) scale(${hw / 100})">${HATS[hi].svg}</g>` : '';
  const gl = gi ? `<g transform="translate(100 ${ey}) scale(${eh / 28})">${GLASSES[gi].svg}</g>` : '';
  return `<svg class="avatar" width="${size}" height="${size}" viewBox="-10 -34 220 234" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}">
  <defs><clipPath id="avclip"><circle cx="100" cy="100" r="98"/></clipPath></defs>
  <circle cx="100" cy="100" r="98" fill="${c.bg}"/><g clip-path="url(#avclip)">${c.svg()}</g>${gl}${hat}</svg>`;
}

// Seletor com três abas: Personagem, Chapéus e Óculos (combine à vontade e veja na prévia)
function mountAvatarEditor(el, state, onChange) {
  let tab = 'char';
  const TABS = { char: ['🧑 Personagem', 'id'], hat: ['🎩 Chapéus', 'hat'], glasses: ['🕶️ Óculos', 'glasses'] };
  const render = () => {
    const cur = { id: state.id || 0, hat: state.hat || 0, glasses: state.glasses || 0 };
    let items;
    if (tab === 'char') items = CHARACTERS.map((c, i) => ({ i, label: c.name, svg: avatarSVG({ ...cur, id: i }, 64), sel: cur.id === i }));
    else if (tab === 'hat') items = HATS.map((h, i) => ({ i, label: h.name, svg: i ? avatarSVG({ ...cur, hat: i }, 64) : '<div class="nohat">🚫</div>', sel: cur.hat === i }));
    else items = GLASSES.map((g, i) => ({ i, label: g.name, svg: i ? avatarSVG({ ...cur, glasses: i }, 64) : '<div class="nohat">🚫</div>', sel: cur.glasses === i }));
    const extra = [state.hat ? HATS[state.hat].name : '', state.glasses ? GLASSES[state.glasses].name : ''].filter(Boolean).join(' · ');
    el.innerHTML = `
      <div class="av-preview">${avatarSVG(cur, 150)}</div>
      <div class="av-name">${CHARACTERS[cur.id].name}${extra ? ' · ' + extra : ''}</div>
      <div class="av-tabs2">${Object.entries(TABS).map(([k, v]) => `<button class="tab${tab === k ? ' on' : ''}" data-t="${k}">${v[0]}</button>`).join('')}</div>
      <div class="av-grid">${items.map((o) => `<button class="av-pick${o.sel ? ' sel' : ''}" data-i="${o.i}" aria-label="${o.label}" title="${o.label}">${o.svg}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; render(); }));
    el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { state[TABS[tab][1]] = +b.dataset.i; onChange && onChange(state); render(); }));
  };
  render();
}
