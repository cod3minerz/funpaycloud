import svgPaths from "./svg-it7vbpom1r";

function FaviconSvg() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="favicon.svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g clipPath="url(#clip0_6_2127)" id="favicon.svg">
          <path d={svgPaths.p19b2600} fill="url(#paint0_linear_6_2127)" id="Vector" />
          <path d={svgPaths.p301435c0} id="Vector_2" stroke="var(--stroke-0, white)" strokeOpacity="0.1" strokeWidth="1.125" />
          <g id="Group">
            <path d={svgPaths.p1698e3c0} fill="url(#paint1_linear_6_2127)" id="Vector_3" stroke="url(#paint2_linear_6_2127)" strokeWidth="0.28125" />
            <g id="Group_2">
              <path d={svgPaths.p2812e800} id="Vector_4" stroke="url(#paint3_linear_6_2127)" strokeDasharray="0.06 2.25" strokeLinecap="round" strokeWidth="0.84375" />
              <path d={svgPaths.p21bb1100} fill="url(#paint4_radial_6_2127)" id="Vector_5" />
              <path d={svgPaths.p230c67f0} fill="url(#paint5_radial_6_2127)" id="Vector_6" />
              <path d={svgPaths.pea45d00} id="Vector_7" stroke="url(#paint6_linear_6_2127)" strokeDasharray="0.06 2.25" strokeLinecap="round" strokeWidth="0.84375" />
              <path d={svgPaths.p259ab00} fill="url(#paint7_radial_6_2127)" id="Vector_8" />
              <path d={svgPaths.p1d4c1a80} fill="url(#paint8_radial_6_2127)" id="Vector_9" />
            </g>
            <path d={svgPaths.p2ae8bb00} id="Vector_10" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.84375" />
            <path d={svgPaths.p161ef980} id="Vector_11" stroke="var(--stroke-0, white)" strokeWidth="0.5625" />
          </g>
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6_2127" x1="0" x2="0" y1="0" y2="2304">
            <stop stopColor="#0F0F13" />
            <stop offset="1" stopColor="#1A1B26" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_6_2127" x1="11.25" x2="11.25" y1="11.25" y2="443.25">
            <stop stopColor="#2A5BE7" />
            <stop offset="1" stopColor="#133B9E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_6_2127" x1="11.25" x2="24.75" y1="11.25" y2="24.75">
            <stop stopColor="#A1B8FF" />
            <stop offset="0.5" stopColor="white" />
            <stop offset="1" stopColor="#A1B8FF" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_6_2127" x1="11.25" x2="24.75" y1="5.625" y2="5.625">
            <stop stopColor="#4FD6FF" />
            <stop offset="1" stopColor="#4FACFF" />
          </linearGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(11.25 12.375) scale(0.675)" gradientUnits="userSpaceOnUse" id="paint4_radial_6_2127" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(24.75 12.375) scale(0.675)" gradientUnits="userSpaceOnUse" id="paint5_radial_6_2127" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint6_linear_6_2127" x1="11.25" x2="24.75" y1="23.625" y2="23.625">
            <stop stopColor="#4FACFF" />
            <stop offset="1" stopColor="#4FD6FF" />
          </linearGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(24.75 23.625) scale(0.675)" gradientUnits="userSpaceOnUse" id="paint7_radial_6_2127" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(11.25 23.625) scale(0.675)" gradientUnits="userSpaceOnUse" id="paint8_radial_6_2127" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <clipPath id="clip0_6_2127">
            <rect fill="white" height="36" width="36" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FaviconSvgFill() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[36px]" data-name="favicon.svg fill">
      <FaviconSvg />
    </div>
  );
}

function Logo() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 size-[36px]" data-name="Logo">
      <FaviconSvgFill />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="absolute bg-[rgba(10,132,255,0.5)] blur-[8px] inset-0 opacity-0 rounded-[9999px]" data-name="Overlay+Blur" />
      <Logo />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-white tracking-[-0.5px] whitespace-nowrap">
        <p className="leading-[28px] text-[20px]">FunPayBot</p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Link">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Link1() {
  return (
    <div className="relative rounded-[9999px] shrink-0" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[20px] py-[8px] relative">
        <button className="cursor-pointer flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] text-left whitespace-nowrap">
          <p className="leading-[20px]">Возможности</p>
        </button>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="relative rounded-[9999px] shrink-0" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[20px] py-[8px] relative">
        <button className="cursor-pointer flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] text-left whitespace-nowrap">
          <p className="leading-[20px]">Тарифы</p>
        </button>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="relative rounded-[9999px] shrink-0" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[20px] py-[8px] relative">
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] whitespace-nowrap">
          <p className="leading-[20px]">Плагины</p>
        </div>
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="relative rounded-[9999px] shrink-0" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[20px] py-[8px] relative">
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] whitespace-nowrap">
          <p className="leading-[20px]">Настройка</p>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <div className="content-stretch flex gap-[4px] items-center p-[5px] relative rounded-[9999px] shrink-0" data-name="Nav">
      <div aria-hidden="true" className="absolute backdrop-blur-[2px] bg-[rgba(255,255,255,0.05)] inset-0 pointer-events-none rounded-[9999px]" />
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Link1 />
      <Link2 />
      <Link3 />
      <Link4 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Link5() {
  return (
    <div className="content-stretch flex flex-col items-start px-[12px] py-[8px] relative shrink-0" data-name="Link">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#e1e1e6] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Войти</p>
      </div>
    </div>
  );
}

function Link6() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start px-[24px] py-[10px] relative rounded-[9999px] shrink-0" data-name="Link">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" data-name="Link:shadow" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#1a1b26] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Регистрация</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Link5 />
      <Link6 />
    </div>
  );
}

function Container() {
  return (
    <div className="max-w-[1536px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center max-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between max-w-[inherit] pl-[24px] pr-[24.02px] relative w-full">
          <Link />
          <Nav />
          <Container3 />
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pb-[25px] pt-[24px] px-[2232px] top-0 w-[6000px]" data-name="Header">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-b border-solid inset-0 pointer-events-none" />
      <Container />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">
        <p className="leading-[20px]">🍪 Мы используем cookie</p>
      </div>
    </div>
  );
}

function Link7() {
  return (
    <div className="absolute h-[39.75px] left-0 text-[#0a84ff] top-[24.75px] w-[233.98px]" data-name="Link">
      <div className="-translate-y-1/2 absolute flex flex-col h-[23px] justify-center left-[159.88px] top-[8.5px] w-[74.424px]">
        <p className="leading-[22.75px]">Политикой</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col h-[23px] justify-center left-0 top-[31.25px] w-[147.834px]">
        <p className="leading-[22.75px]">конфиденциальности</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="font-['Inter:Regular',sans-serif] font-normal h-[68.25px] leading-[0] not-italic relative shrink-0 text-[14px] w-full" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col h-[46px] justify-center left-0 text-[#a8a8b3] top-[21.88px] w-[363.22px]">
        <p className="leading-[22.75px] mb-0">Это помогает сайту работать лучше. Продолжая, вы</p>
        <p className="leading-[22.75px]">{`соглашаетесь с нашей `}</p>
      </div>
      <Link7 />
      <div className="-translate-y-1/2 absolute flex flex-col h-[23px] justify-center left-[146.61px] text-[#a8a8b3] top-[56px] w-[4.403px]">
        <p className="leading-[22.75px]">.</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start min-w-[370px] relative shrink-0 w-[370px]" data-name="Container">
      <Container7 />
      <Container8 />
    </div>
  );
}

function ButtonSvg() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Button → SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Button â SVG">
          <path d="M15 5L5 15" id="Vector" stroke="var(--stroke-0, #A8A8B3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M5 5L15 15" id="Vector_2" stroke="var(--stroke-0, #A8A8B3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-between relative w-full">
        <Container6 />
        <ButtonSvg />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#0a84ff] relative rounded-[12px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[16px] py-[10px] relative w-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(59,130,246,0.2),0px_4px_6px_-4px_rgba(59,130,246,0.2)]" data-name="Button:shadow" />
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap">
            <p className="leading-[20px]">Хорошо, понятно</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderOverlayBlur() {
  return (
    <div className="backdrop-blur-[6px] bg-[rgba(26,27,38,0.95)] content-stretch flex flex-col gap-[16px] items-start min-w-[448px] p-[21px] relative rounded-[16px] shrink-0" data-name="Background+Border+OverlayBlur">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" data-name="Overlay+Shadow" />
      <Container5 />
      <Button />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute bottom-[481.5px] content-stretch flex flex-col items-start max-w-[448px] right-[16px]" data-name="Container">
      <BackgroundBorderOverlayBlur />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-gradient-to-r from-[#0a84ff] relative rounded-[4px] shrink-0 to-[#a855f7]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center px-[8px] py-[2px] relative">
        <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[4px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow" />
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-center text-white tracking-[0.5px] uppercase whitespace-nowrap">
          <p className="leading-[15px]">Cloud</p>
        </div>
      </div>
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_6_2211)" id="SVG">
          <path d={svgPaths.p23c52300} id="Vector" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.p2505ef80} id="Vector_2" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d="M3.5 3.5H3.50583" id="Vector_3" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d="M3.5 10.5H3.50583" id="Vector_4" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
        <defs>
          <clipPath id="clip0_6_2211">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative">
        <Svg />
        <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap">
          <p className="leading-[20px]">Не требует включенного ПК</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#1a1b26] content-stretch flex gap-[11.99px] items-center px-[17px] py-[7px] relative rounded-[9999px] shrink-0" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Background />
      <Container11 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="absolute bg-gradient-to-r blur-[6px] from-[#0a84ff] inset-[-4px] opacity-70 rounded-[9999px] to-[#9333ea]" data-name="Gradient+Blur" />
      <BackgroundBorder />
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[32px] relative shrink-0" data-name="Margin">
      <Container10 />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-center relative shadow-[0px_25px_25px_0px_rgba(0,0,0,0.15)] shrink-0" data-name="Heading 1">
      <div className="flex flex-col font-['Inter:Black',sans-serif] font-black justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-center text-white tracking-[-4.8px] whitespace-nowrap">
        <p className="leading-[96px] mb-0 text-[96px]">Автоматизация</p>
        <p className="bg-clip-text bg-gradient-to-r from-[#22d3ee] leading-[96px] text-[96px] text-[transparent] to-[#9333ea] via-1/2 via-[#3b82f6]">продаж на FunPay</p>
      </div>
    </div>
  );
}

function Heading1Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[32px] relative shrink-0" data-name="Heading 1:margin">
      <Heading />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-center max-w-[768px] px-[4.05px] relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[24px] text-center whitespace-nowrap">
        <p className="leading-[32px] mb-0">Мощный облачный бот 24/7. Автовыдача товаров, мгновенное</p>
        <p className="leading-[32px] mb-0">автоподнятие лотов, умный автоответчик и полное управление</p>
        <p className="leading-[32px]">прямо из Telegram.</p>
      </div>
    </div>
  );
}

function Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[768px] pb-[48px] relative shrink-0" data-name="Margin">
      <Container12 />
    </div>
  );
}

function Svg1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path d={svgPaths.p35420c00} id="Vector" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2727b3e0} id="Vector_2" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p3a4a0d50} id="Vector_3" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2140db20} id="Vector_4" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Link8() {
  return (
    <div className="bg-white relative rounded-[16px] self-stretch shadow-[0px_0px_40px_0px_rgba(255,255,255,0.3)] shrink-0" data-name="Link">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[12px] h-full items-center justify-center pb-[17.5px] pt-[16.5px] px-[40px] relative">
          <Svg1 />
          <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#1a1b26] text-[18px] text-center whitespace-nowrap">
            <p className="leading-[28px]">Запустить бота</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.05)] content-stretch flex items-center justify-center px-[41px] py-[17px] relative rounded-[16px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-center text-white whitespace-nowrap">
        <p className="leading-[28px]">Ознакомиться с функциями</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative shrink-0" data-name="Container">
      <Link8 />
      <Button1 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="col-1 justify-self-start relative row-1 self-start shrink-0" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center leading-[0] not-italic pl-[2px] pr-[2.02px] relative text-center whitespace-nowrap">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[24px] text-white">
          <p className="leading-[32px]">24/7</p>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[12px] tracking-[0.6px] uppercase">
          <p className="leading-[16px]">Стабильный онлайн</p>
        </div>
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="col-2 justify-self-start relative row-1 self-start shrink-0" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center leading-[0] not-italic pl-[15.49px] pr-[15.48px] relative text-center whitespace-nowrap">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[24px] text-white">
          <p className="leading-[32px]">IPv4</p>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[12px] tracking-[0.6px] uppercase">
          <p className="leading-[16px]">Защита от банов</p>
        </div>
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="col-3 justify-self-start relative row-1 self-start shrink-0" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center leading-[0] not-italic pl-[0.64px] pr-[0.66px] relative text-center whitespace-nowrap">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[24px] text-white">
          <p className="leading-[32px]">AI</p>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[12px] tracking-[0.6px] uppercase">
          <p className="leading-[16px]">Нейросети в ответах</p>
        </div>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="col-4 justify-self-start relative row-1 self-start shrink-0" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center leading-[0] not-italic relative text-center whitespace-nowrap">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[24px] text-white">
          <p className="leading-[32px]">30+</p>
        </div>
        <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[12px] tracking-[0.6px] uppercase">
          <p className="leading-[16px]">Плагинов в каталоге</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="gap-x-[64px] gap-y-[64px] grid grid-cols-[repeat(4,minmax(0,1fr))] grid-rows-[_52px] h-[85px] pt-[33px] relative shrink-0 w-[822.31px]" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t inset-0 pointer-events-none" />
      <Paragraph />
      <Paragraph1 />
      <Paragraph2 />
      <Paragraph3 />
    </div>
  );
}

function Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[64px] relative shrink-0" data-name="Margin">
      <HorizontalBorder />
    </div>
  );
}

function Section() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[2488px] max-w-[1024px] right-[2488px] top-[192px]" data-name="Section">
      <Margin />
      <Heading1Margin />
      <Margin1 />
      <Container13 />
      <Margin2 />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[48px] text-white whitespace-nowrap">
        <p className="leading-[48px]">Модули системы</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[576px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[18px] whitespace-nowrap">
        <p className="leading-[28px] mb-0">Комплексные инструменты для автоматизации вашего магазина</p>
        <p className="leading-[28px]">на площадке FunPay.</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[576px]" data-name="Container">
      <Heading1 />
      <Container16 />
    </div>
  );
}

function Svg2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d="M4.16667 10H15.8333" id="Vector" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1ae0b780} id="Vector_2" stroke="var(--stroke-0, #0A84FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Link9() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Link">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0a84ff] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Открыть весь каталог</p>
      </div>
      <Svg2 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-name="Container">
      <Container15 />
      <Link9 />
    </div>
  );
}

function Svg3() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d="M8.75 4.98167L19.25 10.99" id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p3f027190} id="Vector_2" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.pf146b00} id="Vector_3" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M14 25.6667V14" id="Vector_4" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay() {
  return (
    <div className="bg-[rgba(59,130,246,0.1)] content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Svg3 />
    </div>
  );
}

function Svg4() {
  return (
    <div className="relative size-[24px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path d="M5 12H19" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M12 5L19 12L12 19" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function SvgCssTransform() {
  return (
    <div className="content-stretch flex flex-col h-[56.971px] items-start pb-[23.029px] relative shrink-0" data-name="SVG:css-transform">
      <div className="flex items-center justify-center relative shrink-0 size-[33.941px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-45 flex-none">
          <Svg4 />
        </div>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute content-stretch flex items-end justify-between left-0 right-[-4.97px] top-[-4.97px]" data-name="Container">
      <Overlay />
      <SvgCssTransform />
    </div>
  );
}

function Margin3() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container18 />
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-full">
        <p className="leading-[28px]">Автовыдача товаров</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[22.75px] mb-0">Бот моментально отправляет купленный товар (текст, ключи</p>
        <p className="leading-[22.75px] mb-0">из файла) клиенту 24/7. Больше не нужно дежурить у</p>
        <p className="leading-[22.75px]">компьютера.</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6.75px] items-start relative w-full">
        <Heading2 />
        <Container20 />
      </div>
    </div>
  );
}

function Link10() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(19,20,31,0.6)] col-1 justify-self-stretch relative rounded-[24px] row-1 self-start shrink-0" data-name="Link">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[25px] relative w-full">
          <div className="absolute inset-px opacity-0" data-name="Gradient" style={{ backgroundImage: "linear-gradient(155.31deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)" }} />
          <Margin3 />
          <Container19 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Svg5() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p3997a780} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p275e0300} id="Vector_2" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay1() {
  return (
    <div className="bg-[rgba(16,185,129,0.1)] content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Svg5 />
    </div>
  );
}

function Svg6() {
  return (
    <div className="relative size-[24px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path d="M5 12H19" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M12 5L19 12L12 19" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function SvgCssTransform1() {
  return (
    <div className="content-stretch flex flex-col h-[56.971px] items-start pb-[23.029px] relative shrink-0" data-name="SVG:css-transform">
      <div className="flex items-center justify-center relative shrink-0 size-[33.941px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-45 flex-none">
          <Svg6 />
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex items-end justify-between left-0 right-[-4.97px] top-[-4.97px]" data-name="Container">
      <Overlay1 />
      <SvgCssTransform1 />
    </div>
  );
}

function Margin4() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container21 />
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-full">
        <p className="leading-[28px]">Автоподнятие лотов</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[0.625px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[22.75px] mb-0">Ваши предложения всегда в топе. Бот будет регулярно</p>
        <p className="leading-[22.75px]">нажимать кнопку поднятия, соблюдая безопасные тайминги.</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col gap-[6.875px] items-start relative shrink-0 w-full" data-name="Container">
      <Heading3 />
      <Container23 />
    </div>
  );
}

function Margin5() {
  return (
    <div className="h-[104.25px] min-h-[81.5px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-end min-h-[inherit] pt-[22.75px] relative size-full">
        <Container22 />
      </div>
    </div>
  );
}

function Link11() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(19,20,31,0.6)] col-2 justify-self-stretch relative rounded-[24px] row-1 self-start shrink-0" data-name="Link">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[25px] relative w-full">
          <div className="absolute inset-px opacity-0" data-name="Gradient" style={{ backgroundImage: "linear-gradient(155.261deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)" }} />
          <Margin4 />
          <Margin5 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Svg7() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p18eadc00} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M14 21H14.0117" id="Vector_2" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay2() {
  return (
    <div className="bg-[rgba(59,130,246,0.1)] content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Svg7 />
    </div>
  );
}

function Svg8() {
  return (
    <div className="relative size-[24px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path d="M5 12H19" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M12 5L19 12L12 19" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function SvgCssTransform2() {
  return (
    <div className="content-stretch flex flex-col h-[56.971px] items-start pb-[23.029px] relative shrink-0" data-name="SVG:css-transform">
      <div className="flex items-center justify-center relative shrink-0 size-[33.941px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-45 flex-none">
          <Svg8 />
        </div>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute content-stretch flex items-end justify-between left-0 right-[-4.97px] top-[-4.97px]" data-name="Container">
      <Overlay2 />
      <SvgCssTransform2 />
    </div>
  );
}

function Margin6() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container24 />
      </div>
    </div>
  );
}

function Heading4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-full">
        <p className="leading-[28px]">Telegram Панель</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[22.75px] mb-0">Управляйте продажами прямо с телефона. Получайте</p>
        <p className="leading-[22.75px] mb-0">уведомления о новых заказах и отвечайте клиентам через</p>
        <p className="leading-[22.75px]">ТГ-бота.</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6.75px] items-start relative w-full">
        <Heading4 />
        <Container26 />
      </div>
    </div>
  );
}

function Link12() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(19,20,31,0.6)] col-3 justify-self-stretch relative rounded-[24px] row-1 self-start shrink-0" data-name="Link">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[25px] relative w-full">
          <div className="absolute inset-px opacity-0" data-name="Gradient" style={{ backgroundImage: "linear-gradient(155.31deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)" }} />
          <Margin6 />
          <Container25 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Svg9() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.pb35f080} id="Vector" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p241aad40} id="Vector_2" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.paadca80} id="Vector_3" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p3c6e6080} id="Vector_4" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p22bf9300} id="Vector_5" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M14 15.1667H18.6667" id="Vector_6" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p2967b500} id="Vector_7" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M14 9.33333H23.3333" id="Vector_8" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.pe046980} id="Vector_9" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p27cad640} id="Vector_10" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p2d4483f1} id="Vector_11" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p21700c00} id="Vector_12" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p90e4440} id="Vector_13" stroke="var(--stroke-0, #C084FC)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay3() {
  return (
    <div className="bg-[rgba(168,85,247,0.1)] content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Svg9 />
    </div>
  );
}

function Svg10() {
  return (
    <div className="relative size-[24px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path d="M5 12H19" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M12 5L19 12L12 19" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function SvgCssTransform3() {
  return (
    <div className="content-stretch flex flex-col h-[56.971px] items-start pb-[23.029px] relative shrink-0" data-name="SVG:css-transform">
      <div className="flex items-center justify-center relative shrink-0 size-[33.941px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-45 flex-none">
          <Svg10 />
        </div>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex items-end justify-between left-0 right-[-4.97px] top-[-4.97px]" data-name="Container">
      <Overlay3 />
      <SvgCssTransform3 />
    </div>
  );
}

function Margin7() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container27 />
      </div>
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-full">
        <p className="leading-[28px]">ИИ-Нейросети (DeepSeek)</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[22.75px] mb-0">Встроенный ИИ может консультировать покупателей по</p>
        <p className="leading-[22.75px] mb-0">товарам, исправлять ваши ошибки и писать уникальные</p>
        <p className="leading-[22.75px]">ответы на отзывы.</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6.75px] items-start relative w-full">
        <Heading5 />
        <Container29 />
      </div>
    </div>
  );
}

function Link13() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(19,20,31,0.6)] col-1 justify-self-stretch relative rounded-[24px] row-2 self-start shrink-0" data-name="Link">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[25px] relative w-full">
          <div className="absolute inset-px opacity-0" data-name="Gradient" style={{ backgroundImage: "linear-gradient(155.31deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)" }} />
          <Margin7 />
          <Container28 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Svg11() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p221c4a00} id="Vector" stroke="var(--stroke-0, #FACC15)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay4() {
  return (
    <div className="bg-[rgba(234,179,8,0.1)] content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Svg11 />
    </div>
  );
}

function Svg12() {
  return (
    <div className="relative size-[24px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path d="M5 12H19" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M12 5L19 12L12 19" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function SvgCssTransform4() {
  return (
    <div className="content-stretch flex flex-col h-[56.971px] items-start pb-[23.029px] relative shrink-0" data-name="SVG:css-transform">
      <div className="flex items-center justify-center relative shrink-0 size-[33.941px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-45 flex-none">
          <Svg12 />
        </div>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute content-stretch flex items-end justify-between left-0 right-[-4.97px] top-[-4.97px]" data-name="Container">
      <Overlay4 />
      <SvgCssTransform4 />
    </div>
  );
}

function Margin8() {
  return (
    <div className="h-[68px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container30 />
      </div>
    </div>
  );
}

function Heading6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-full">
        <p className="leading-[28px]">Умный демпинг цен</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[22.75px] mb-0">Автоматический анализ конкурентов по вашим запросам. Бот</p>
        <p className="leading-[22.75px] mb-0">сам снизит цену на рубль, чтобы ваш лот всегда был самым</p>
        <p className="leading-[22.75px]">выгодным.</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6.75px] items-start relative w-full">
        <Heading6 />
        <Container32 />
      </div>
    </div>
  );
}

function Link14() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(19,20,31,0.6)] col-2 justify-self-stretch relative rounded-[24px] row-2 self-start shrink-0" data-name="Link">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[25px] relative w-full">
          <div className="absolute inset-px opacity-0" data-name="Gradient" style={{ backgroundImage: "linear-gradient(155.31deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)" }} />
          <Margin8 />
          <Container31 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Svg13() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d="M5.83333 14H22.1667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p6041c80} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay5() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col items-start p-[12px] relative rounded-[12px] shrink-0" data-name="Overlay">
      <Svg13 />
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Container">
      <Overlay5 />
    </div>
  );
}

function Margin9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[16px] relative w-full">
        <Container33 />
      </div>
    </div>
  );
}

function Heading7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-white w-full">
        <p className="leading-[28px]">Более 30 плагинов</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)] w-full">
        <p className="leading-[22.75px] mb-0">От автовывода средств на карту до продажи аккаунтов с</p>
        <p className="leading-[22.75px] mb-0">Lolzteam и авто-накрутки. Перейдите в каталог, чтобы</p>
        <p className="leading-[22.75px]">увидеть всё.</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6.75px] items-start relative w-full">
        <Heading7 />
        <Container35 />
      </div>
    </div>
  );
}

function Link15() {
  return (
    <div className="bg-[#0a84ff] col-3 justify-self-stretch relative rounded-[24px] row-2 self-start shrink-0" data-name="Link">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start justify-between p-[25px] relative w-full">
          <Margin9 />
          <Container34 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#0a84ff] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Container17() {
  return (
    <div className="gap-x-[24px] gap-y-[24px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[__222.25px_222.25px] h-[468.5px] relative shrink-0 w-full" data-name="Container">
      <Link10 />
      <Link11 />
      <Link12 />
      <Link13 />
      <Link14 />
      <Link15 />
    </div>
  );
}

function Section1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[48px] items-start left-[2232px] max-w-[1536px] px-[24px] right-[2232px] top-[997px]" data-name="Section">
      <Container14 />
      <Container17 />
    </div>
  );
}

function Heading8() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[48px] text-center text-white whitespace-nowrap">
        <p className="leading-[48px]">Прозрачные тарифы</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-col items-center max-w-[672px] pb-[16px] relative shrink-0 w-[672px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[18px] text-center whitespace-nowrap">
        <p className="leading-[28px] mb-0">Никаких скрытых платежей или комиссий с продаж. Вы оплачиваете</p>
        <p className="leading-[28px]">только доступ к облачной инфраструктуре.</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="relative rounded-[12px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[24px] py-[12px] relative">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap">
          <p className="leading-[20px]">1 Месяц</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="absolute bg-[#0a84ff] content-stretch flex flex-col items-center px-[7px] py-[3px] right-[-8.15px] rounded-[9999px] top-[-12px]" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[#1a1b26] border-solid inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">
        <p className="leading-[20px]">-15%</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="relative rounded-[12px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[24px] py-[12px] relative">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] text-center whitespace-nowrap">
          <p className="leading-[20px]">3 Месяца</p>
        </div>
        <BackgroundBorderShadow />
      </div>
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="absolute bg-[#a855f7] content-stretch flex flex-col items-center px-[7px] py-[3px] right-[-7.28px] rounded-[9999px] top-[-12px]" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[#1a1b26] border-solid inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">
        <p className="leading-[20px]">-35%</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="relative rounded-[12px] shrink-0" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center px-[24px] py-[12px] relative">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] text-center whitespace-nowrap">
          <p className="leading-[20px]">1 Год</p>
        </div>
        <BackgroundBorderShadow1 />
      </div>
    </div>
  );
}

function OverlayBorderOverlayBlur() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.05)] content-stretch flex items-start p-[7px] relative rounded-[16px] shrink-0" data-name="Overlay+Border+OverlayBlur">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="absolute bg-[rgba(255,255,255,0.1)] inset-[7px_66.01%_7px_2.19%] rounded-[12px]" data-name="Overlay+Border+Shadow">
        <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      </div>
      <Button2 />
      <Button3 />
      <Button4 />
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full" data-name="Container">
      <Heading8 />
      <Container37 />
      <OverlayBorderOverlayBlur />
    </div>
  );
}

function Svg14() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p1b228440} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay6() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.05)] content-stretch flex items-center justify-center left-0 p-[12px] rounded-[16px] top-0" data-name="Overlay">
      <Svg14 />
    </div>
  );
}

function Heading9() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-[0.34px] top-[68px]" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white tracking-[-0.6px] whitespace-nowrap">
        <p className="leading-[32px]">Стартовый</p>
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Для базовой автоматизации магазина</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute content-stretch flex items-center left-0 right-[0.34px] top-[104px]" data-name="Container">
      <Container43 />
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[124px] relative shrink-0 w-full" data-name="Container">
      <Overlay6 />
      <Heading9 />
      <Container42 />
    </div>
  );
}

function Margin10() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Margin">
      <Container41 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="content-stretch flex gap-[4px] items-baseline leading-[0] not-italic relative shrink-0 w-full whitespace-nowrap" data-name="Paragraph">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center relative shrink-0 text-[36px] text-white tracking-[-0.9px]">
        <p className="leading-[40px]">199₽</p>
      </div>
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[16px]">
        <p className="leading-[24px]">/ 30 дн.</p>
      </div>
    </div>
  );
}

function HorizontalBorder1() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.7)] whitespace-nowrap">
        <p className="leading-[19.5px] mb-0">Основное ядро бота + набор плагинов для защиты</p>
        <p className="leading-[19.5px]">аккаунта и комфортной работы.</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Paragraph4 />
      <HorizontalBorder1 />
    </div>
  );
}

function Margin11() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Margin">
      <Container44 />
    </div>
  );
}

function Svg15() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg15 />
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Автовыдача, Автоподнятие, ТГ-Бот</p>
      </div>
    </div>
  );
}

function Svg16() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin1() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg16 />
    </div>
  );
}

function Container47() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin1 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Activity Heatmap, Auto Refund</p>
      </div>
    </div>
  );
}

function Svg17() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin2() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg17 />
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin2 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Notes on Buyers, Confirm Reminder</p>
      </div>
    </div>
  );
}

function Svg18() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin3() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg18 />
    </div>
  );
}

function Container49() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin3 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Review Reminder, Lot Cloner</p>
      </div>
    </div>
  );
}

function Svg19() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #34D399)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin4() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg19 />
    </div>
  );
}

function Container50() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin4 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Ещё 6+ плагинов Стартового уровня</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Button">
      <div className="flex flex-[1_0_0] flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#a8a8b3] text-[12px]">
        <p className="decoration-solid leading-[16px] underline">Смотреть полный список...</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative w-full" data-name="Container">
      <Container46 />
      <Container47 />
      <Container48 />
      <Container49 />
      <Container50 />
      <Button5 />
    </div>
  );
}

function Margin12() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Margin">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center pb-[32px] relative size-full">
          <Container45 />
        </div>
      </div>
    </div>
  );
}

function Link16() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex flex-col items-center py-[16px] relative rounded-[12px] shrink-0 w-full" data-name="Link">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
        <p className="leading-[24px]">Создать аккаунт</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[24px] relative size-full">
        <Margin10 />
        <Margin11 />
        <Margin12 />
        <Link16 />
      </div>
    </div>
  );
}

function Border() {
  return (
    <div className="col-1 justify-self-stretch relative rounded-[24px] row-1 self-stretch shrink-0" data-name="Border">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[5px] relative size-full">
          <div className="absolute bg-[#13141f] inset-[1px_1.34px_1px_1px] opacity-50 rounded-[24px]" data-name="Background" />
          <Container40 />
        </div>
      </div>
    </div>
  );
}

function Svg20() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p1b67a410} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p37a5cd80} id="Vector_2" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M2.33333 10.5H25.6667" id="Vector_3" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay7() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.05)] content-stretch flex items-center justify-center left-0 p-[12px] rounded-[16px] top-0" data-name="Overlay">
      <Svg20 />
    </div>
  );
}

function Heading10() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-[0.33px] top-[68px]" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white tracking-[-0.6px] whitespace-nowrap">
        <p className="leading-[32px]">Продвинутый</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Для активных продавцов</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute content-stretch flex items-center left-0 right-[0.33px] top-[104px]" data-name="Container">
      <Container54 />
    </div>
  );
}

function Container52() {
  return (
    <div className="h-[124px] relative shrink-0 w-full" data-name="Container">
      <Overlay7 />
      <Heading10 />
      <Container53 />
    </div>
  );
}

function Margin13() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Margin">
      <Container52 />
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="content-stretch flex gap-[4px] items-baseline leading-[0] not-italic relative shrink-0 w-full whitespace-nowrap" data-name="Paragraph">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center relative shrink-0 text-[36px] text-white tracking-[-0.9px]">
        <p className="leading-[40px]">349₽</p>
      </div>
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[16px]">
        <p className="leading-[24px]">/ 30 дн.</p>
      </div>
    </div>
  );
}

function HorizontalBorder2() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.7)] whitespace-nowrap">
        <p className="leading-[19.5px] mb-0">Массовое редактирование, резервное</p>
        <p className="leading-[19.5px]">копирование и глубокая аналитика.</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Paragraph5 />
      <HorizontalBorder2 />
    </div>
  );
}

function Margin14() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Margin">
      <Container55 />
    </div>
  );
}

function Svg21() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin5() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg21 />
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin5 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Все функции тарифа «Стартовый»</p>
      </div>
    </div>
  );
}

function Svg22() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin6() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg22 />
    </div>
  );
}

function Container58() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin6 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Auto Withdraw (Автовывод средств)</p>
      </div>
    </div>
  );
}

function Svg23() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin7() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg23 />
    </div>
  );
}

function Container59() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin7 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Copy Lots (Перенос лотов)</p>
      </div>
    </div>
  );
}

function Svg24() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin8() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg24 />
    </div>
  );
}

function Container60() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin8 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Mass Price Editor (Смена цен)</p>
      </div>
    </div>
  );
}

function Svg25() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #60A5FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin9() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg25 />
    </div>
  );
}

function Container61() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin9 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Ещё 4+ плагинов Продвинутого уровня</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Button">
      <div className="flex flex-[1_0_0] flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#a8a8b3] text-[12px]">
        <p className="decoration-solid leading-[16px] underline">Смотреть полный список...</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative w-full" data-name="Container">
      <Container57 />
      <Container58 />
      <Container59 />
      <Container60 />
      <Container61 />
      <Button6 />
    </div>
  );
}

function Margin15() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Margin">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center pb-[32px] relative size-full">
          <Container56 />
        </div>
      </div>
    </div>
  );
}

function Link17() {
  return (
    <div className="bg-[#2563eb] content-stretch flex flex-col items-center py-[16px] relative rounded-[12px] shrink-0 w-full" data-name="Link">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0.33px_0_0] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(59,130,246,0.2),0px_4px_6px_-4px_rgba(59,130,246,0.2)]" data-name="Link:shadow" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
        <p className="leading-[24px]">Создать аккаунт</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[24px] relative size-full">
        <Margin13 />
        <Margin14 />
        <Margin15 />
        <Link17 />
      </div>
    </div>
  );
}

function Border1() {
  return (
    <div className="col-2 justify-self-stretch relative rounded-[24px] row-1 self-stretch shrink-0" data-name="Border">
      <div aria-hidden="true" className="absolute border border-[rgba(59,130,246,0.3)] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[5px] relative size-full">
          <div className="absolute bg-gradient-to-b from-[#161824] inset-[1px_1.33px_1px_1px] opacity-50 rounded-[24px] to-[#12131c]" data-name="Gradient" />
          <Container51 />
        </div>
      </div>
    </div>
  );
}

function Svg26() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p3f54800} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M5.83333 24.5H22.1667" id="Vector_2" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Overlay8() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.05)] content-stretch flex items-center justify-center left-0 p-[12px] rounded-[16px] top-0" data-name="Overlay">
      <Svg26 />
    </div>
  );
}

function Heading11() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 right-[0.34px] top-[68px]" data-name="Heading 3">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white tracking-[-0.6px] whitespace-nowrap">
        <p className="leading-[32px]">Команда</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Для крупных проектов и интеграций</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="absolute content-stretch flex items-center left-0 right-[0.34px] top-[104px]" data-name="Container">
      <Container65 />
    </div>
  );
}

function Container63() {
  return (
    <div className="h-[124px] relative shrink-0 w-full" data-name="Container">
      <Overlay8 />
      <Heading11 />
      <Container64 />
    </div>
  );
}

function Margin16() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Margin">
      <Container63 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="content-stretch flex gap-[4px] items-baseline leading-[0] not-italic relative shrink-0 w-full whitespace-nowrap" data-name="Paragraph">
      <div className="flex flex-col font-['Inter:Extra_Bold',sans-serif] font-extrabold justify-center relative shrink-0 text-[36px] text-white tracking-[-0.9px]">
        <p className="leading-[40px]">499₽</p>
      </div>
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a8a8b3] text-[16px]">
        <p className="leading-[24px]">/ 30 дн.</p>
      </div>
    </div>
  );
}

function HorizontalBorder3() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t inset-0 pointer-events-none" />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.7)] whitespace-nowrap">
        <p className="leading-[19.5px] mb-0">ИИ-сети, авто-демпинг цен и полная интеграция</p>
        <p className="leading-[19.5px]">со сторонними сервисами (LZT, PlayerOK).</p>
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Paragraph6 />
      <HorizontalBorder3 />
    </div>
  );
}

function Margin17() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Margin">
      <Container66 />
    </div>
  );
}

function Svg27() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin10() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg27 />
    </div>
  );
}

function Container68() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin10 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Все функции тарифа «Продвинутый»</p>
      </div>
    </div>
  );
}

function Svg28() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin11() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg28 />
    </div>
  );
}

function Container69() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin11 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Auto Dumping (Автодемпинг цен)</p>
      </div>
    </div>
  );
}

function Svg29() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin12() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg29 />
    </div>
  );
}

function Container70() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin12 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Auto Code (Чтение кодов с почты)</p>
      </div>
    </div>
  );
}

function Svg30() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin13() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg30 />
    </div>
  );
}

function Container71() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin13 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">{`GPT Консультант & ИИ-Отзывы`}</p>
      </div>
    </div>
  );
}

function Svg31() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p39be50} id="Vector" stroke="var(--stroke-0, #FBBF24)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function SvgMargin14() {
  return (
    <div className="content-stretch flex flex-col h-[18px] items-start pt-[2px] relative shrink-0 w-[16px]" data-name="SVG:margin">
      <Svg31 />
    </div>
  );
}

function Container72() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <SvgMargin14 />
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#d1d5db] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Интеграции со сторонними API</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Button">
      <div className="flex flex-[1_0_0] flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#a8a8b3] text-[12px]">
        <p className="decoration-solid leading-[16px] underline">Смотреть полный список...</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative w-full" data-name="Container">
      <Container68 />
      <Container69 />
      <Container70 />
      <Container71 />
      <Container72 />
      <Button7 />
    </div>
  );
}

function Margin18() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Margin">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center pb-[32px] relative size-full">
          <Container67 />
        </div>
      </div>
    </div>
  );
}

function Link18() {
  return (
    <div className="bg-gradient-to-r content-stretch flex flex-col from-[#f59e0b] items-center py-[16px] relative rounded-[12px] shrink-0 to-[#f97316] w-full" data-name="Link">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0.34px_0_0] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(249,115,22,0.2),0px_4px_6px_-4px_rgba(249,115,22,0.2)]" data-name="Link:shadow" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
        <p className="leading-[24px]">Создать аккаунт</p>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[24px] relative size-full">
        <Margin16 />
        <Margin17 />
        <Margin18 />
        <Link18 />
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="absolute bg-gradient-to-r from-[#f59e0b] left-[35.41%] right-[35.41%] rounded-[9999px] to-[#f97316] top-[-11px]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[12px] py-[4px] relative w-full">
        <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow" />
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-white tracking-[0.6px] uppercase whitespace-nowrap">
          <p className="leading-[16px]">Максимум</p>
        </div>
      </div>
    </div>
  );
}

function Border2() {
  return (
    <div className="col-3 justify-self-stretch relative rounded-[24px] row-1 self-stretch shrink-0" data-name="Border">
      <div aria-hidden="true" className="absolute border border-[rgba(245,158,11,0.3)] border-solid inset-0 pointer-events-none rounded-[24px]" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[5px] relative size-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_0.34px_0_0] rounded-[24px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" data-name="Overlay+Shadow" />
          <div className="absolute bg-gradient-to-b from-[#1a1814] inset-[1px_1.34px_1px_1px] opacity-50 rounded-[24px] to-[#121110]" data-name="Gradient" />
          <Container62 />
          <Background1 />
        </div>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="gap-x-[24px] gap-y-[24px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[_620px] max-w-[1152px] pl-[16.008px] pr-[8px] relative self-stretch shrink-0 w-[1152px]" data-name="Container">
      <Border />
      <Border1 />
      <Border2 />
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex h-[620px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container39 />
    </div>
  );
}

function Section2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[64px] items-start left-[2232px] max-w-[1536px] px-[24px] right-[2232px] top-[1761.5px]" data-name="Section">
      <Container36 />
      <Container38 />
    </div>
  );
}

function Heading12() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[30px] text-center text-white whitespace-nowrap">
        <p className="leading-[36px]">Частые вопросы</p>
      </div>
    </div>
  );
}

function Svg32() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d="M7.5 15L12.5 10L7.5 5" id="Vector" stroke="var(--stroke-0, #A8A8B3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function SlotSummary() {
  return (
    <div className="relative shrink-0 w-full" data-name="Slot → Summary">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
          <p className="leading-[28px]">Необходимо ли держать компьютер включенным?</p>
        </div>
        <Svg32 />
      </div>
    </div>
  );
}

function Details() {
  return (
    <div className="bg-[rgba(19,20,31,0.5)] relative rounded-[16px] shrink-0 w-full" data-name="Details">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="content-stretch flex flex-col items-start p-[21px] relative w-full">
        <SlotSummary />
      </div>
    </div>
  );
}

function Svg33() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d="M7.5 15L12.5 10L7.5 5" id="Vector" stroke="var(--stroke-0, #A8A8B3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function SlotSummary1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Slot → Summary">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
          <p className="leading-[28px]">Безопасно ли это для моего аккаунта FunPay?</p>
        </div>
        <Svg33 />
      </div>
    </div>
  );
}

function Details1() {
  return (
    <div className="bg-[rgba(19,20,31,0.5)] relative rounded-[16px] shrink-0 w-full" data-name="Details">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="content-stretch flex flex-col items-start p-[21px] relative w-full">
        <SlotSummary1 />
      </div>
    </div>
  );
}

function Svg34() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d="M7.5 15L12.5 10L7.5 5" id="Vector" stroke="var(--stroke-0, #A8A8B3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function SlotSummary2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Slot → Summary">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
          <p className="leading-[28px]">Что такое плагины 99-го уровня?</p>
        </div>
        <Svg34 />
      </div>
    </div>
  );
}

function Details2() {
  return (
    <div className="bg-[rgba(19,20,31,0.5)] relative rounded-[16px] shrink-0 w-full" data-name="Details">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="content-stretch flex flex-col items-start p-[21px] relative w-full">
        <SlotSummary2 />
      </div>
    </div>
  );
}

function Svg35() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d="M7.5 15L12.5 10L7.5 5" id="Vector" stroke="var(--stroke-0, #A8A8B3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function SlotSummary3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Slot → Summary">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">
        <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-white whitespace-nowrap">
          <p className="leading-[28px]">Как управлять ботом?</p>
        </div>
        <Svg35 />
      </div>
    </div>
  );
}

function Details3() {
  return (
    <div className="bg-[rgba(19,20,31,0.5)] relative rounded-[16px] shrink-0 w-full" data-name="Details">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.05)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="content-stretch flex flex-col items-start p-[21px] relative w-full">
        <SlotSummary3 />
      </div>
    </div>
  );
}

function Container73() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Details />
      <Details1 />
      <Details2 />
      <Details3 />
    </div>
  );
}

function Section3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[48px] items-start left-[2616px] max-w-[768px] px-[24px] right-[2616px] top-[2799.5px]" data-name="Section">
      <Heading12 />
      <Container73 />
    </div>
  );
}

function Heading13() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Heading 2">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[48px] text-center text-white whitespace-nowrap">
        <p className="leading-[48px]">Хватит выдавать товары руками</p>
      </div>
    </div>
  );
}

function Container75() {
  return (
    <div className="content-stretch flex flex-col items-center max-w-[672px] pb-[16px] relative shrink-0 w-[672px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[18px] text-center whitespace-nowrap">
        <p className="leading-[28px] mb-0">Делегируйте рутину боту и сфокусируйтесь на поиске новых товаров и</p>
        <p className="leading-[28px]">увеличении прибыли.</p>
      </div>
    </div>
  );
}

function Link19() {
  return (
    <div className="bg-white content-stretch flex items-start justify-center px-[48px] py-[16px] relative rounded-[12px] shrink-0" data-name="Link">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[12px] shadow-[0px_20px_25px_-5px_rgba(255,255,255,0.1),0px_8px_10px_-6px_rgba(255,255,255,0.1)]" data-name="Link:shadow" />
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#1a1b26] text-[18px] text-center whitespace-nowrap">
        <p className="leading-[28px]">Создать аккаунт</p>
      </div>
    </div>
  );
}

function Container74() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] items-center relative w-full">
        <Heading13 />
        <Container75 />
        <Link19 />
      </div>
    </div>
  );
}

function Section4() {
  return (
    <div className="absolute bg-gradient-to-r from-[rgba(10,132,255,0.2)] left-[2256px] right-[2256px] rounded-[24px] to-[rgba(147,51,234,0.2)] top-[3339.5px]" data-name="Section">
      <div className="content-stretch flex flex-col items-start overflow-clip p-[65px] relative rounded-[inherit] w-full">
        <div className="absolute bg-[rgba(10,132,255,0.2)] blur-[50px] opacity-50 right-px rounded-[9999px] size-[256px] top-px" data-name="Overlay+Blur" />
        <Container74 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[24px]" />
    </div>
  );
}

function Main() {
  return (
    <div className="h-[3777.5px] relative shrink-0 w-full z-[4]" data-name="Main">
      <Section />
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
    </div>
  );
}

function FaviconSvg1() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="favicon.svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g clipPath="url(#clip0_6_2103)" id="favicon.svg">
          <path d={svgPaths.p3a2f9c00} fill="url(#paint0_linear_6_2103)" id="Vector" />
          <path d={svgPaths.p1ec1800} id="Vector_2" stroke="var(--stroke-0, white)" strokeOpacity="0.1" />
          <g id="Group">
            <path d={svgPaths.p12a40080} fill="url(#paint1_linear_6_2103)" id="Vector_3" stroke="url(#paint2_linear_6_2103)" strokeWidth="0.25" />
            <g id="Group_2">
              <path d={svgPaths.p3c78ba00} id="Vector_4" stroke="url(#paint3_linear_6_2103)" strokeDasharray="0.05 2" strokeLinecap="round" strokeWidth="0.75" />
              <path d={svgPaths.p360e4500} fill="url(#paint4_radial_6_2103)" id="Vector_5" />
              <path d={svgPaths.p3c282780} fill="url(#paint5_radial_6_2103)" id="Vector_6" />
              <path d={svgPaths.p353c1dc0} id="Vector_7" stroke="url(#paint6_linear_6_2103)" strokeDasharray="0.05 2" strokeLinecap="round" strokeWidth="0.75" />
              <path d={svgPaths.p39c22300} fill="url(#paint7_radial_6_2103)" id="Vector_8" />
              <path d={svgPaths.pea90e00} fill="url(#paint8_radial_6_2103)" id="Vector_9" />
            </g>
            <path d="M14 15L16 19L18 15" id="Vector_10" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeWidth="0.75" />
            <path d={svgPaths.p4894380} id="Vector_11" stroke="var(--stroke-0, white)" strokeWidth="0.5" />
          </g>
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6_2103" x1="0" x2="0" y1="0" y2="2048">
            <stop stopColor="#0F0F13" />
            <stop offset="1" stopColor="#1A1B26" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_6_2103" x1="10" x2="10" y1="10" y2="394">
            <stop stopColor="#2A5BE7" />
            <stop offset="1" stopColor="#133B9E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_6_2103" x1="10" x2="22" y1="10" y2="22">
            <stop stopColor="#A1B8FF" />
            <stop offset="0.5" stopColor="white" />
            <stop offset="1" stopColor="#A1B8FF" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_6_2103" x1="10" x2="22" y1="5" y2="5">
            <stop stopColor="#4FD6FF" />
            <stop offset="1" stopColor="#4FACFF" />
          </linearGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(10 11) scale(0.6)" gradientUnits="userSpaceOnUse" id="paint4_radial_6_2103" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(22 11) scale(0.6)" gradientUnits="userSpaceOnUse" id="paint5_radial_6_2103" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint6_linear_6_2103" x1="10" x2="22" y1="21" y2="21">
            <stop stopColor="#4FACFF" />
            <stop offset="1" stopColor="#4FD6FF" />
          </linearGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(22 21) scale(0.6)" gradientUnits="userSpaceOnUse" id="paint7_radial_6_2103" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(10 21) scale(0.6)" gradientUnits="userSpaceOnUse" id="paint8_radial_6_2103" r="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#4FACFF" />
          </radialGradient>
          <clipPath id="clip0_6_2103">
            <rect fill="white" height="32" width="32" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function FaviconSvgFill1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[32px]" data-name="favicon.svg fill">
      <FaviconSvg1 />
    </div>
  );
}

function Logo1() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[720px] overflow-clip relative shrink-0 size-[32px]" data-name="Logo">
      <FaviconSvgFill1 />
    </div>
  );
}

function Container79() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-white whitespace-nowrap">
        <p className="leading-[28px] text-[20px]">FunPayBot</p>
      </div>
    </div>
  );
}

function Link20() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Link">
      <Logo1 />
      <Container79 />
    </div>
  );
}

function Container80() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[384px] relative shrink-0 w-[384px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] whitespace-nowrap">
        <p className="leading-[22.75px] mb-0">Мощный облачный инструмент для автоматизации</p>
        <p className="leading-[22.75px] mb-0">торговли на FunPay. Управляйте магазином прямо из</p>
        <p className="leading-[22.75px]">Telegram.</p>
      </div>
    </div>
  );
}

function Container81() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[384px] pt-[1.2px] relative shrink-0 w-[384px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.6)] whitespace-nowrap">
        <p className="leading-[16px] mb-0">* Сервис является независимым ПО и не является</p>
        <p className="leading-[16px]">официальным партнером FunPay.</p>
      </div>
    </div>
  );
}

function Container78() {
  return (
    <div className="col-[1/span_2] content-stretch flex flex-col gap-[14.8px] items-start justify-self-stretch pb-[7.75px] relative row-1 self-start shrink-0" data-name="Container">
      <Link20 />
      <Container80 />
      <Container81 />
    </div>
  );
}

function Heading14() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
        <p className="leading-[24px]">Платформа</p>
      </div>
    </div>
  );
}

function Item() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <button className="cursor-pointer flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] text-left w-full">
        <p className="leading-[20px]">Возможности</p>
      </button>
    </div>
  );
}

function Item1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <button className="cursor-pointer flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] text-left w-full">
        <p className="leading-[20px]">Тарифные планы</p>
      </button>
    </div>
  );
}

function Item2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">Плагины (Магазин)</p>
      </div>
    </div>
  );
}

function Item3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">Оплата и активация</p>
      </div>
    </div>
  );
}

function List() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="List">
      <Item />
      <Item1 />
      <Item2 />
      <Item3 />
    </div>
  );
}

function Container82() {
  return (
    <div className="col-3 content-stretch flex flex-col gap-[16px] items-start justify-self-stretch pb-[28px] relative row-1 self-start shrink-0" data-name="Container">
      <Heading14 />
      <List />
    </div>
  );
}

function Heading15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
        <p className="leading-[24px]">Документация</p>
      </div>
    </div>
  );
}

function Item4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">База знаний (Настройка)</p>
      </div>
    </div>
  );
}

function Item5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">Публичная оферта</p>
      </div>
    </div>
  );
}

function Item6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">Политика конфиденциальности</p>
      </div>
    </div>
  );
}

function Item7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">Условия возврата</p>
      </div>
    </div>
  );
}

function Item8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a8a8b3] text-[14px] w-full">
        <p className="leading-[20px]">Контакты и реквизиты</p>
      </div>
    </div>
  );
}

function List1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="List">
      <Item4 />
      <Item5 />
      <Item6 />
      <Item7 />
      <Item8 />
    </div>
  );
}

function Container83() {
  return (
    <div className="col-4 content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative row-1 self-start shrink-0" data-name="Container">
      <Heading15 />
      <List1 />
    </div>
  );
}

function Container77() {
  return (
    <div className="gap-x-[48px] gap-y-[48px] grid grid-cols-[repeat(4,minmax(0,1fr))] grid-rows-[_172px] h-[172px] relative shrink-0 w-full" data-name="Container">
      <Container78 />
      <Container82 />
      <Container83 />
    </div>
  );
}

function Container85() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.5)] whitespace-nowrap">
        <p className="leading-[16px]">© 2026 FunPayBot. Все права защищены.</p>
      </div>
    </div>
  );
}

function Container86() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.5)] whitespace-nowrap">
        <p className="leading-[16px]">Самозанятый Петров Павел Сергеевич, ИНН 332403413516</p>
      </div>
    </div>
  );
}

function Container87() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(168,168,179,0.5)] whitespace-nowrap">
        <p className="leading-[16px]">Поддержка: @beedge | Email: funpaybot@bk.ru</p>
      </div>
    </div>
  );
}

function Container84() {
  return (
    <div className="relative shrink-0 w-[356px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative w-full">
        <Container85 />
        <Container86 />
        <Container87 />
      </div>
    </div>
  );
}

function HorizontalBorder4() {
  return (
    <div className="content-stretch flex items-center pt-[33px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t inset-0 pointer-events-none" />
      <Container84 />
    </div>
  );
}

function Container76() {
  return (
    <div className="max-w-[1536px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[48px] items-start max-w-[inherit] px-[24px] relative w-full">
        <Container77 />
        <HorizontalBorder4 />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="bg-[#0a0b14] relative shrink-0 w-full z-[3]" data-name="Footer">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start pb-[64px] pt-[65px] px-[2232px] relative w-full">
        <Container76 />
      </div>
    </div>
  );
}

function Background2() {
  return <div className="absolute bg-[#0a0b14] inset-0 min-h-[3750px] z-[2]" data-name="Background" />;
}

function GridSvg() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="grid.svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g clipPath="url(#clip0_6_2098)" id="grid.svg">
          <g id="Vector" />
          <g id="Vector_2" />
          <path d="M40 0H0V40" id="Vector_3" stroke="var(--stroke-0, white)" strokeOpacity="0.2" />
        </g>
        <defs>
          <clipPath id="clip0_6_2098">
            <rect fill="white" height="40" width="40" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function GridSvgFill() {
  return (
    <div className="content-stretch flex flex-col h-[3750px] items-start overflow-clip pb-[3710px] pr-[5960px] relative shrink-0 w-[6000px]" data-name="grid.svg fill">
      <GridSvg />
    </div>
  );
}

function Image() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-start opacity-10" data-name="Image">
      <GridSvgFill />
    </div>
  );
}

function Background3() {
  return (
    <div className="absolute bg-[#0a0b14] inset-[0_0_465.5px_0] overflow-clip z-[1]" data-name="Background">
      <div className="absolute bg-[rgba(10,132,255,0.1)] blur-[60px] left-[-600px] rounded-[9999px] size-[3000px] top-[-375px]" data-name="Overlay+Blur" />
      <div className="absolute bg-[rgba(88,28,135,0.1)] blur-[60px] bottom-[-375px] right-[-600px] rounded-[9999px] size-[3000px]" data-name="Overlay+Blur" />
      <div className="-translate-x-1/2 absolute bg-[rgba(30,58,138,0.05)] blur-[50px] h-[2400px] left-1/2 rounded-[9999px] top-[300px] w-[3600px]" data-name="Overlay+Blur" />
      <Image />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col isolate items-start min-h-[3750px] overflow-x-clip overflow-y-auto relative shrink-0 w-full" data-name="Container">
      <Main />
      <Footer />
      <Background2 />
      <Background3 />
    </div>
  );
}

export default function Component6000WLight() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="6000w light" style={{ backgroundImage: "linear-gradient(90deg, rgba(26, 27, 38, 0.3) 2.5%, rgba(26, 27, 38, 0) 2.5%), linear-gradient(rgba(26, 27, 38, 0.3) 2.5%, rgba(26, 27, 38, 0) 2.5%), linear-gradient(90deg, rgb(10, 11, 20) 0%, rgb(10, 11, 20) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <Header />
      <Container4 />
      <Container9 />
    </div>
  );
}