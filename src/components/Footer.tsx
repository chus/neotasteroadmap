export default function Footer() {
  return (
    <footer
      className="w-full px-6 py-5 flex items-center justify-between"
      style={{ backgroundColor: 'var(--nt-dark)' }}
    >
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="var(--nt-green)" />
          <text x="14" y="19.5" textAnchor="middle" fill="#0D2818" fontSize="16" fontWeight="700" fontFamily="system-ui">N</text>
        </svg>
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          NeoTaste Product Roadmap
        </span>
      </div>
      <a
        href="https://www.linkedin.com/in/agustintonna/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] hover:underline"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Made by Agus
      </a>
    </footer>
  )
}
