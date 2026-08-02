function useMessages() {
  return {
    messages: [],
    hasMore: false,
    loadMore: () => {},
  };
}

export default useMessages;
