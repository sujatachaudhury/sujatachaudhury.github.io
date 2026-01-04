import styles from './ActionItem.module.css';

interface ActionItem {
  title: string;
  authors?: string;
  url?: string;
  props?: Record<string, string>;
}

interface ActionItemProps {
  items: ActionItem[];
}

export function ActionItem({ items }: ActionItemProps) {
  return (
    <ul className={styles.actionItemList}>
      {items.map((item, index) => {
        const ItemWrapper = item.url ? 'a' : 'div';
        const wrapperProps = item.url ? { href: item.url } : {};
        
        return (
          <li key={index} className={`${styles.actionItem} ${item.url ? styles.interactive : ''}`}>
            <ItemWrapper {...wrapperProps} className={styles.actionItemContent}>
              <div className={styles.actionItemTitle}>
                {item.title}
              </div>
              <div className={styles.actionItemMeta}>
                {item.authors && (
                  <span className={styles.actionItemAuthors}>
                    {item.authors}
                  </span>
                )}
                {item.props && Object.entries(item.props).map(([key, value]) => (
                  value && (
                    <span key={key} className={styles.actionItemProp}>
                      {value}
                    </span>
                  )
                ))}
              </div>
            </ItemWrapper>
          </li>
        );
      })}
    </ul>
  );
}