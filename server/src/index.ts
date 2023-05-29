export const handler = async (): Promise<any> => {
    const response = {
      statusCode: 200,
      body: JSON.stringify('The GitHub Action successfully deployed to AWS!!'),
    };
    return response;
  };