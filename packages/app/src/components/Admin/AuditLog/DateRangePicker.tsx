import React, { FC, useRef, forwardRef, useCallback } from 'react';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


type CustomInputProps = {
  buttonRef: React.Ref<HTMLButtonElement>
  onClick?: () => void;
}

const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>((props: CustomInputProps) => {
  return (
    <button
      type="button"
      className="btn btn-outline-secondary dropdown-toggle"
      ref={props.buttonRef}
      onClick={props.onClick}
    >
      <i className="fa fa-fw fa-calendar" /> Date
    </button>
  );
});


type DateRangePickerProps = {
  startDate: Date | null
  endDate: Date | null
  onChangeDate: (dateList: Date[] | null[]) => void
}

export const DateRangePicker: FC<DateRangePickerProps> = (props: DateRangePickerProps) => {
  const { startDate, endDate } = props;

  const buttonRef = useRef(null);

  const changeDateHandler = useCallback((dateList: Date[] | null[]) => {
    if (props.onChangeDate != null) {
      const [start, end] = dateList;
      const isSameTime = (start != null && end != null) && (start.getTime() === end.getTime());
      if (isSameTime) {
        props.onChangeDate([null, null]);
      }
      else {
        props.onChangeDate(dateList);
      }
    }
  }, []);

  return (
    <div className="btn-group mr-2 mb-3">
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={changeDateHandler}
        customInput={<CustomInput buttonRef={buttonRef} />}
      />
    </div>
  );
};
