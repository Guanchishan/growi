import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import dateFnsFormat from 'date-fns/format';

import UserPicture from '../../User/UserPicture';
import UserMenu from './UserMenu';

import { createSubscribedElement } from '../../UnstatedUtils';
import AppContainer from '../../../services/AppContainer';

class UserTable extends React.Component {


  render() {
    const { t } = this.props;
    let userStatusLabel;
    let additionalClassName;
    let text;

    this.props.users.forEach((user) => {
      userStatusLabel = (
        <span className={`label ${additionalClassName}`}>
          {text}
        </span>
      );

      switch (user.status) {
        case 1:
          additionalClassName = 'label-info';
          text = 'Approval Pending';
          break;
        case 2:
          additionalClassName = 'label-success';
          text = 'Active';
          break;
        case 3:
          additionalClassName = 'label-warning';
          text = 'Suspended';
          break;
        case 4:
          additionalClassName = 'label-danger';
          text = 'Deleted';
          break;
        case 5:
          additionalClassName = 'label-info';
          text = 'Invited';
          break;
      }
    });


    return (
      <Fragment>
        <h2>{ t('User_Management') }</h2>

        <table className="table table-default table-bordered table-user-list">
          <thead>
            <tr>
              <th width="100px">#</th>
              <th>{ t('status') }</th>
              <th><code>{ t('User') }</code></th>
              <th>{ t('Name') }</th>
              <th>{ t('Email') }</th>
              <th width="100px">{ t('Created') }</th>
              <th width="150px">{ t('Last_Login') }</th>
              <th width="70px"></th>
            </tr>
          </thead>
          <tbody>
            {this.props.users.map((user) => {
              return (
                <tr key={user._id}>
                  <td>
                    <UserPicture user={user} className="picture img-circle" />
                    {user.admin && <span className="label label-inverse label-admin ml-2">{ t('administrator') }</span>}
                  </td>
                  <td>{userStatusLabel}</td>
                  <td>
                    <strong>{user.username}</strong>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{dateFnsFormat(new Date(user.createdAt), 'YYYY-MM-DD')}</td>
                  <td>
                    { user.lastLoginAt && <span>{dateFnsFormat(new Date(user.lastLoginAt), 'YYYY-MM-DD HH:mm')}</span> }
                  </td>
                  <td>
                    <UserMenu user={user} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Fragment>
    );
  }

}

const UserTableWrapper = (props) => {
  return createSubscribedElement(UserTable, props, [AppContainer]);
};

UserTable.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,

  users: PropTypes.array.isRequired,

};

export default withTranslation()(UserTableWrapper);
