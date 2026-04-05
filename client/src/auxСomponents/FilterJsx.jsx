export const FilterJsx = (props) => {
  let tags = [];
  // put this ↓ in staticApi and then too
  let elemlist = [
    ["дата создания", "date_create"],
    ["дата редоктирования", "data_update"],
    ["дата дэдлайна", "data_dead_line"],
    ["по имени", "name"],
  ];

  const result = elemlist.map((elem) => (
    <div className="z-10 ">
      <input
        className="custom-checkbox z-20"
        name={elem[1]}
        value={props.isOn?.[elem[1]]}
        type="checkbox"
        role="switch"
        id="flexSwitchCheckDefault"
        onChange={props.handleSwitch}
        checked={props.isOn?.[elem[1]]}
      />
      <label className="ml-2" shtmlFor="flexSwitchCheckDefault">
        {elem[0]}
      </label>
    </div>
  ));

  tags = tags.map((tag) => (
    <div class="form-check">
      <input class="" type="checkbox" value="" id="" />
      <label class="">Default checkbox</label>
    </div>
  ));

  return (
    <div className="relative z-0 row-start-1 row-span-5 col-end-7 border rounded-lg">
      {result}
      {tags}
    </div>
  );
};
