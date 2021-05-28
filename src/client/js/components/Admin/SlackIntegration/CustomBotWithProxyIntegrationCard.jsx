import React from 'react';
import PropTypes from 'prop-types';
import IntegrationSuccessOrFailed from './IntegrationSuccessOrFailed';

const CustomBotWithProxyIntegrationCard = (props) => {
  const { workspaceNames } = props;

  return (
    <div className="d-flex justify-content-center my-5 bot-integration">

      <div className="card rounded shadow border-0 w-50 admin-bot-card">
        <h5 className="card-title font-weight-bold mt-3 ml-4">Slack</h5>
        <div className="card-body px-5">
          {props.slackWorkSpaces.map((slackWorkSpaceName) => {
            return (
              <div key={slackWorkSpaceName.name} className={slackWorkSpaceName.active ? 'card slack-work-space-name-card' : ''}>
                <div className="m-2 text-center">
                  <h5 className="font-weight-bold">{slackWorkSpaceName.name}</h5>
                  <img width={20} height={20} src="/images/slack-integration/growi-bot-kun-icon.png" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center w-25 mt-5">
        <IntegrationSuccessOrFailed workspaceNames={workspaceNames} />
      </div>

      <div className="card rounded-lg shadow border-0 w-50 admin-bot-card">
        <div className="row">
          <h5 className="card-title font-weight-bold mt-3 ml-4 col">GROWI App</h5>
          <div className="pull-right mt-3 mr-3">
            <a className="icon-fw fa fa-repeat fa-2x"></a>
          </div>
        </div>
        <div className="card-body p-4 mb-5 text-center">
          <div className="btn-group-vertical w-50">
            {props.growiApps.map((growiApp) => {
              return (
                <button
                  type="button"
                  key={growiApp.name}
                  className={growiApp.active ? 'btn btn-primary mb-3' : 'btn btn-outline-primary mb-3'}
                >{growiApp.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

CustomBotWithProxyIntegrationCard.propTypes = {
  growiApps: PropTypes.array.isRequired,
  slackWorkSpaces: PropTypes.array,
  isSlackScopeSet: PropTypes.bool,
  workspaceNames: PropTypes.array.isRequired,
};

export default CustomBotWithProxyIntegrationCard;
