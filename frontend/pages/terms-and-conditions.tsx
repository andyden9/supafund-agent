import { Divider, Flex, Typography } from 'antd';
import styled from 'styled-components';

import {
  SUPAFUND_LICENSE,
  SUPAFUND_URL,
  TERMS_AND_CONDITIONS_URL,
  WEB3AUTH_TERMS_AND_CONDITIONS_URL,
  WEB3AUTH_URL,
} from '@/constants/urls';
import { APP_HEIGHT, APP_WIDTH } from '@/constants/width';

const { Title, Paragraph, Text } = Typography;

const TermsContainer = styled(Flex)`
  align-items: center;
  flex-direction: column;
  overflow-y: auto;
  height: calc(${APP_HEIGHT}px - 45px);
  width: calc(${APP_WIDTH}px - 45px);
  margin: auto;
  padding: 32px 24px;
  gap: 24px;
`;

const Section = styled.div`
  max-width: 720px;
  width: 100%;
`;

export default function TermsAndConditions() {
  return (
    <TermsContainer>
      <Section>
        <Title level={3} className="mb-0">
          Supafund 服务条款
        </Title>
        <Text type="secondary">最后更新：2025 年 1 月</Text>
      </Section>

      <Section>
        {/* prettier-ignore */}
        <Paragraph>
          欢迎使用{' '}
          <a href={SUPAFUND_URL} target="_blank" rel="noopener noreferrer">
            Supafund
          </a>
          ，本条款适用于通过 Supafund 桌面应用或浏览器界面运行 Supafund 代理的所有用户，继续使用即表示你同意以下内容。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>1. 非托管声明</Title>
        {/* prettier-ignore */}
        <Paragraph>
          Supafund 不为用户托管或保管任何资金。所有钱包、Safe、多签地址均由你自行控制。请妥善保管私钥、密码及备份信息，任何因密钥丢失或泄露导致的资产损失由你自行承担。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>2. 风险提示</Title>
        {/* prettier-ignore */}
        <Paragraph>
          Supafund 代理会与预测市场及其他去中心化协议交互。链上交易存在波动、合约漏洞、RPC 不稳定、第三方预言机故障等风险。请仅投入能够承受损失的资金，并自行评估法律与合规要求。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>3. 软件许可</Title>
        {/* prettier-ignore */}
        <Paragraph>
          Supafund 以开源形式发布，遵循{' '}
          <a href={SUPAFUND_LICENSE} target="_blank" rel="noopener noreferrer">
            仓库 LICENSE
          </a>
          。你可以自由复制、修改和部署该软件，但需遵守相应的开源许可条款。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>4. Web3Auth 登录</Title>
        <Paragraph>
          Supafund 集成了{' '}
          <a href={WEB3AUTH_URL} target="_blank" rel="noopener noreferrer">
            Web3Auth
          </a>{' '}
          作为可选的登录与备份方案。使用该功能即表示你同意{' '}
          <a
            href={WEB3AUTH_TERMS_AND_CONDITIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Web3Auth 的服务条款
          </a>
          。Supafund 不会存储你的社交登录凭据。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>5. 第三方服务</Title>
        {/* prettier-ignore */}
        <Paragraph>
          Supafund 可能通过 API 或 SDK 访问第三方服务（如 RPC、Subgraph、消息代理等）。这些服务的稳定性、响应速度和合规性不在 Supafund 控制范围内，请在使用前阅读各自的服务条款。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>6. 更新与通知</Title>
        <Paragraph>
          Supafund 可能不定期发布更新修复漏洞或优化体验。最新版本将通过{' '}
          <a href={SUPAFUND_URL} target="_blank" rel="noopener noreferrer">
            官网
          </a>{' '}
          与仓库同步。继续使用即视为接受更新后的条款。
        </Paragraph>
      </Section>

      <Section>
        <Title level={4}>7. 联系方式</Title>
        <Paragraph>
          如果你对本条款有任何疑问，请通过{' '}
          <a
            href={TERMS_AND_CONDITIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            官方渠道
          </a>{' '}
          与我们联系。
        </Paragraph>
      </Section>

      <Section>
        <Divider />
        <Text type="secondary">使用 Supafund 代表你理解并接受上述条款。</Text>
      </Section>
    </TermsContainer>
  );
}
