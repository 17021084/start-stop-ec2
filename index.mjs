import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";


// EC2につけたタグ
const TAG_KEY = "auto-start-stop";
const TAG_VALUE = "true";
const REGION = "ap-northeast-1";


const aws_access_key_id = "";
const aws_secret_access_key = "";

const ec2Client = new EC2Client({
  credentials: {
    accessKeyId: aws_access_key_id,
    secretAccessKey: aws_secret_access_key,
  },
  region: REGION,
});

const manageEC2Instances = async (event) => {
  try {
    //　Schedule 設定する時、payloadで　起動・停止か決めます
    const action = event.action

    // タグでインスタントを絞り込みます
    const describeCommand = new DescribeInstancesCommand({
      Filters: [{ Name: `tag:${TAG_KEY}`, Values: [TAG_VALUE] }],
    });

    const instancesData = await ec2Client.send(describeCommand);

    // 見つけない場合
    if (
      !instancesData.Reservations ||
      instancesData.Reservations.length === 0
    ) {
      console.log("インスタンスが見つけません");
      return;
    }

    for (const reservation of instancesData.Reservations) {
      for (const instance of reservation.Instances) {
        const instanceId = instance.InstanceId;
        const instanceState = instance.State.Name;

        if (action === "stop" && instanceState === "running") {
          // Stop the instance
          const stopCommand = new StopInstancesCommand({
            InstanceIds: [instanceId],
          });
          await ec2Client.send(stopCommand);
          console.log(`「${instanceId}」とのEC2インスタンスが停止されました！`);
        } else if (action === "start" && instanceState === "stopped") {
          // Start the instance
          const startCommand = new StartInstancesCommand({
            InstanceIds: [instanceId],
          });
          await ec2Client.send(startCommand);
          console.log(`「${instanceId}」とのEC2インスタンスが起動されました`);
        } else {
          console.log(
            `飛ばします、だって「${instanceId}」とのECインスタンスは状態が 「${instanceState}」からです.`
          );
        }
      }
    }
  } catch (error) {
    console.error("エラーはこちら：", error);
  }
};

// // Get action from command line argument
// const action = process.argv[2]; // Example: node ec2-control.js start
// if (action === "start" || action === "stop") {
//   manageEC2Instances(action);
// } else {
//   console.log("Usage: node ec2-control.js start | stop");
// }

manageEC2Instances('start')
