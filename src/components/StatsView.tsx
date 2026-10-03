export function StatsView() {
  return (
    <div className="stats-view">
      <h1>Damage stats</h1>
      <p className="lede">
        This is where you'll compare how templates actually perform: damage per second, which spells and weapons
        carry the load, and how changes to a build move the numbers.
      </p>

      <section className="panel">
        <h2>What's planned</h2>
        <ul className="plan">
          <li>
            <strong>Load a fight.</strong> Paste or upload a combat log from your client and see damage by
            ability over time.
          </li>
          <li>
            <strong>Tie it to a template.</strong> Tag each fight with the template you played, so builds can be
            compared side by side.
          </li>
          <li>
            <strong>Community numbers.</strong> Optionally share summaries to see what's working across players.
          </li>
        </ul>
        <p className="hint">
          The data format is already defined in <code>src/stats/types.ts</code>, so any log source just needs a
          small parser that turns lines into damage events.
        </p>
      </section>
    </div>
  )
}
