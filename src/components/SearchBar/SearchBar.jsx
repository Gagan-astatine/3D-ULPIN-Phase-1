import { forwardRef, useState } from "react";
import { Search, ArrowUpRight, X } from "lucide-react";
import { useTranslation } from '../../i18n/useTranslation.js';
export default forwardRef(function SearchBar({
  query,
  error,
  onQuery,
  onSearch
}, ref) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  return <form className="search" role="search" onSubmit={event => {
    event.preventDefault();
    onSearch(query);
    setFocused(false);
  }}>
      <Search size={18} />
      <input ref={ref} aria-label={t('search.label')} placeholder={t('search.placeholder')} value={query} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} onChange={e => onQuery(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "search-error" : undefined} />
      {query ? <button type="button" className="icon-button" title={t('search.clear')} onClick={() => onQuery("")}>
          <X size={15} />
        </button> : <kbd>↵</kbd>}
      <button className="search-submit" aria-label={t('search.find')} title={t('search.find')}>
        <ArrowUpRight size={18} />
      </button>
      {error && <div id="search-error" className="search-message" role="status">
          {error}
        </div>}
      {focused && !query && !error && <div className="search-suggestions">
          <span>{t('search.demo')}</span>
          {["ULPIN-DEMO-0001", "ULPIN-DEMO-0002", "PARCEL-009"].map(id => <button type="button" key={id} onMouseDown={e => e.preventDefault()} onClick={() => {
        onQuery(id);
        onSearch(id);
        setFocused(false);
      }}>
              {id}
              <ArrowUpRight size={14} />
            </button>)}
        </div>}
    </form>;
});
