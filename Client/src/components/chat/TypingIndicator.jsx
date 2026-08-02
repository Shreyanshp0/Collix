function TypingIndicator({ users = [] }) {
  if (!users || users.length === 0) return null;

  const names = users.map((u) => u.name || u.username || 'Someone').filter(Boolean);

  let text = '';
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = 'Several people are typing...';
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-2 w-2 rounded-full bg-presenceGreen animate-ping" />
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-presenceGreen">
        ● {text}
      </p>
    </div>
  );
}

export default TypingIndicator;
