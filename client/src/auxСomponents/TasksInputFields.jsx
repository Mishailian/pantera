// {`position${count}`: {
//    title: '',
//    p: '', <- mb bullshit
//    units: '',
//    quantity: x,
//    deadline: 00.00.0000,
//  }}
import ru from "date-fns/locale/ru";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import NumberPicker from "react-widgets/NumberPicker";
import Combobox from "react-widgets/Combobox";
import "react-widgets/styles.css";

export const TasksInputFields = (props) => {
  return (
    <div className="relative flex flex-row gap-12 h-9 mb-5">
      {/* <input */}
      {/*   value={props.data[props.name].title} */}
      {/*   name="title" */}
      {/*   type="text" */}
      {/*   className=" basis-1/3 taskField interactive-element" */}
      {/*   id="inputCity" */}
      {/*   onChange={(el) => props.chenge({ title: el.target.value }, props.name)} */}
      {/* /> */}
      {/* <Combobox */}
      {/*   // allowCreate={true} */}
      {/*   // autoComplete="on" */}
      {/*   className="basis-1/12 taskField interactive-element" */}
      {/*   value={props.data[props.name].units} */}
      {/*   data={["мм", "см", "м", "км"]} */}
      {/*   onChange={(el) => { */}
      {/*     console.log(el); */}
      {/*     props.chenge( */}
      {/*       { */}
      {/*         units: el, */}
      {/*       }, */}
      {/*       props.name */}
      {/*     ); */}
      {/*   }} */}
      {/* /> */}
      {/* <NumberPicker */}
      {/*   value={props.data[props.name].quantity} */}
      {/*   defaultValue={0} */}
      {/*   className="basis-1/12 taskField interactive-element" */}
      {/*   step={10} */}
      {/*   onChange={(el) => */}
      {/*     props.chenge( */}
      {/*       { */}
      {/*         quantity: el, */}
      {/*       }, */}
      {/*       props.name */}
      {/*     ) */}
      {/*   } */}
      {/* /> */}
      {/* <div> */}
      {/*   <DatePicker */}
      {/*     dateFormat={"yyy/MM/dd"} */}
      {/*     selected={new Date(props.data[props.name].deadline)} */}
      {/*     className=" taskField interactive-element h-9" */}
      {/*     locale={ru} */}
      {/*     onChange={(n) => */}
      {/*       props.chenge( */}
      {/*         { */}
      {/*           deadline: n, */}
      {/*         }, */}
      {/*         props.name */}
      {/*       ) */}
      {/*     } */}
      {/*   /> */}
      {/* </div> */}
      {/* <div className="relative flex flex-row basis-1/2"> */}
      {/*   <input */}
      {/*     placeholder="" */}
      {/*     className="taskField interactive-element basis-11/12" */}
      {/*     value={props.data[props.name].about} */}
      {/*     onChange={(n) => */}
      {/*       props.chenge( */}
      {/*         { */}
      {/*           about: n.target.value, */}
      {/*         }, */}
      {/*         props.name */}
      {/*       ) */}
      {/*     } */}
      {/*   /> */}
      {/*   <button */}
      {/*     className="dButton p-2 pl-4 pr-4" */}
      {/*     onClick={() => { */}
      {/*       props.eventFunc(props.name); */}
      {/*       event.preventDefault(); */}
      {/*     }} */}
      {/*   > */}
      {/*     {props.eventFuncName} */}
      {/*   </button> */}
      {/* </div> */}
    </div>
  );
};
