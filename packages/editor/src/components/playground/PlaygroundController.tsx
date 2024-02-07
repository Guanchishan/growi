import { useCallback } from 'react';

import { useForm } from 'react-hook-form';

import { GlobalCodeMirrorEditorKey } from '../../consts';
import { AllEditorTheme } from '../../services';
import { useCodeMirrorEditorIsolated } from '../../stores';

export const InitEditorValueRow = (): JSX.Element => {

  const { data } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.MAIN);

  const initDoc = data?.initDoc;
  const initEditorValue = useCallback(() => {
    initDoc?.('# Header\n\n- foo\n-bar\n');
  }, [initDoc]);

  return (
    <div className="row">
      <div className="col">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => initEditorValue()}
        >
          Initialize editor value
        </button>
      </div>
    </div>
  );
};

type SetCaretLineRowFormData = {
  lineNumber: number | string;
};

export const SetCaretLineRow = (): JSX.Element => {

  const { data } = useCodeMirrorEditorIsolated(GlobalCodeMirrorEditorKey.MAIN);
  const { register, handleSubmit } = useForm<SetCaretLineRowFormData>({
    defaultValues: {
      lineNumber: 1,
    },
  });

  const setCaretLine = data?.setCaretLine;
  const onSubmit = handleSubmit((submitData) => {
    const lineNumber = Number(submitData.lineNumber) || 1;
    setCaretLine?.(lineNumber);
  });

  return (
    <form className="row mt-3" onSubmit={onSubmit}>
      <div className="col">
        <div className="input-group">
          <input
            {...register('lineNumber')}
            type="number"
            className="form-control"
            placeholder="Input line number"
            aria-label="line number"
            aria-describedby="button-set-cursor"
          />
          <button type="submit" className="btn btn-outline-secondary" id="button-set-cursor">Set the cursor</button>
        </div>
      </div>
    </form>

  );
};

type SetThemeRowProps = {
  setEditorTheme: (value: string) => void,
}
const SetThemeRow = (props: SetThemeRowProps): JSX.Element => {

  const { setEditorTheme } = props;

  const createItems = (items: string[]): JSX.Element => {
    return (
      <div>
        { items.map((theme) => {
          return (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setEditorTheme(theme);
              }}
            >{theme}
            </button>
          );
        }) }
      </div>
    );
  };

  return (
    <>
      <div className="row mt-3">
        <h2>default</h2>
        <div className="col">
          {createItems(AllEditorTheme)}
        </div>
      </div>
    </>
  );
};


type PlaygroundControllerProps = {
  setEditorTheme: (value: string) => void
};

export const PlaygroundController = (props: PlaygroundControllerProps): JSX.Element => {
  const { setEditorTheme } = props;
  return (
    <div className="container mt-5">
      <InitEditorValueRow />
      <SetCaretLineRow />
      <SetThemeRow setEditorTheme={setEditorTheme} />
    </div>
  );
};
