import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from "aws-lambda";

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const response = {
    statusCode: 200,
    body: JSON.stringify("The GitHub Action successfully deployed to AWS!"),
  };
  return response;
};
