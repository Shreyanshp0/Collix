import GroupCard from './GroupCard.jsx';

function GroupList({ groups }) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

export default GroupList;
