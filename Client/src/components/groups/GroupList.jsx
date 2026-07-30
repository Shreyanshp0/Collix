import GroupListItem from './GroupListItem.jsx';

function GroupList({ groups, meta = {} }) {
  return (
    <div className="px-1 py-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((group) => (
          <div key={group.id} className="h-full">
            <GroupListItem group={group} meta={meta[group.id]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupList;
