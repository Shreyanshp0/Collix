function ReadReceipt({ readBy = [], isOwnMessage = false }) {
  if (!isOwnMessage) return null;

  const count = readBy.length;
  if (count === 0) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondaryText" title="Sent">
        ✓
      </span>
    );
  }

  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.14em] text-presenceGreen"
      title={`Read by ${count} member${count > 1 ? 's' : ''}`}
    >
      ✓✓ {count}
    </span>
  );
}

export default ReadReceipt;
