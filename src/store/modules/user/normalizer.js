export const usersMapper = function(users) {
  let result = [];

  result = {
    ...result,
    ...users.reduce(
      (prev, user) => ({
        ...prev,
        [user.id]: userMapper(user)
      }),
      {}
    )
  };

  return result;
};
export const userMapper = user => ({
  id: user.id,
  login: user.login,
  online: user.online,
  email: user.email,
  confirmSendEmail: presentConfirmSendEmail(user.confirmSendEmail),
  userProfileImage: user.profile_img,
  createdAt: user.createdAt,
  onlineStatus: presentUserStatus(user.online)
});

function presentUserStatus(userStatus) {
  if (userStatus) {
    return {
      text: 'Online',
      variant: 'success'
    };
  }
  return {
    text: 'Offline',
    variant: 'secondary'
  };
}

function presentConfirmSendEmail(confirmSendEmailStatus) {
  if (confirmSendEmailStatus) {
    return {
      text: 'Confirmed',
      variant: 'success'
    };
  }
  return {
    text: 'Unconfirmed',
    variant: 'light'
  };
}
