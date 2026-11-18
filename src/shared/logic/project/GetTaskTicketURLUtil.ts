/**
 * Uses the prefix to check if the task mentions a ticket number and if so, it will return the URL with the ticket number
 * */
export const GetTaskTicketURLUtil = (props: {
  ticketUrlTemplate: string;
  ticketUrlPrefix: string;
  task: string;
}) => {
  const { ticketUrlTemplate, ticketUrlPrefix, task } = props;

  if (!ticketUrlTemplate || !ticketUrlPrefix || !task) {
    return "";
  }

  const ticketNumber = task
    .split(" ")
    .find((word) =>
      word.toLowerCase().startsWith(ticketUrlPrefix.toLowerCase())
    );

  if (!ticketNumber) {
    return "";
  }

  return `${ticketUrlTemplate}${ticketNumber}`;
};
