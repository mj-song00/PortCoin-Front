import React, { useEffect, useState, useCallback } from 'react'
import '../css/PortfolioDtatil.css'
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Header from './Header';
import Side from './Side';
import Footer from './Footer';
import qs from 'qs';

// 서버에서 오는 실제 데이터 구조
interface ServerCoin {
  portfolioCoinId: number;
  id: number;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  purchaseDate?: string; // 매수일 
  currentPrice: number;
  change_24h: number;
  profitLoss?: number;
}

interface ServerPortfolioData {
  portfolioId: number;
  name: string;
  coins: ServerCoin[];
}

// 프론트엔드에서 사용할 데이터 구조
interface PortfolioData {
  coinId: number;
  coin: string;
  amount: number;
  percentage: number;
  profit: number | null;
  color: string;
  price: number;
  change24h: number;
  purchasePrice: number;
  purchaseDate?: string; // 매수일 추가
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

interface CaculateData {
  fullName: string;
  image: string;
  profitLoss:number;
}

// 포트폴리오 수정을 위한 새로운 Request DTO
interface CoinUpdatePayload {
  coinId: number;
  amount: number;
  purchasePrice: number;
  purchaseDate: string;
}
interface CoinToUpdatePayload extends CoinUpdatePayload {
  portfolioCoinId: number;
}

interface PortfolioUpdateRequest {
  portfolioId: number;
  toAdd: CoinUpdatePayload[];
  toUpdate: CoinToUpdatePayload[];
  toDelete: number[]; // array of portfolioCoinId
}

// 코인 정보 인터페이스 (수정용)
interface CoinInfo {
  portfolioCoinId?: number; // 유일한 ID, 신규 추가 시에는 없음
  coinId: number;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: string;
}

// 사용 가능한 코인 목록 인터페이스
interface AvailableCoin {
  id: number;
  symbol: string;
  name: string;
}

const PortfolioDetail: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioName, setPortfolioName] = useState<string>('');
  const [coinProfitData, setCoinProfitData] = useState<CaculateData[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCoins, setEditingCoins] = useState<CoinInfo[]>([]);
  const [initialEditingCoins, setInitialEditingCoins] = useState<CoinInfo[]>([]);
  const [availableCoins, setAvailableCoins] = useState<AvailableCoin[]>([]);
  const { refreshAccessToken, isLoggedIn, isLoading } = useAuth();
  const [serverPortfolioData, setServerPortfolioData] = useState<ServerPortfolioData | null>(null);

  // 데이터 로드 함수
  const loadData = async () => {
    setLoading(true);
    
    try {
   
      
      // 코인별 수익률 계산 데이터 가져오기
      
      const profitData = await fetchCaculateData();
     
      // 포트폴리오 데이터를 먼저 가져오기
   
      const portfolioData = await fetchPortfolioData();
      
      // 포트폴리오 데이터가 있으면 24시간 변동률 가져오기
      if (portfolioData && portfolioData.length > 0) {
        const change24hMap = await fetch24hChangeData(portfolioData);
  
        // 24시간 변동률을 포함하여 포트폴리오 데이터 다시 가져오기
        await fetchPortfolioData(change24hMap);
      } else {
        console.log("포트폴리오 데이터가 없어서 24시간 변동률을 가져오지 않습니다.");
      }
      
      console.log("=== 데이터 로드 완료 ===");
    } catch (error) {
      console.error("데이터 로드 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  // 서버에서 계산된 수익률 불러오기 
  const fetchCaculateData = async (): Promise<CaculateData[] | null> => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("액세스 토큰이 없습니다.");
      return null;
    }
    
    try {
      console.log("수익률 계산 API 호출 시작");
      const response = await axios.get<CaculateData[]>(
        `http://localhost:8080/api/v1/portfolio-coins/value`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log("수익률 계산 API 응답:", response.data);
      
      if (response.data) {
        // 서버 응답이 배열인지 단일 객체인지 확인
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        console.log("수익률 계산 데이터 배열:", dataArray);
        setCoinProfitData(dataArray);
        return dataArray;
      }
      
      console.log("수익률 계산 데이터가 없습니다.");
      return null;
    } catch (error: any) {
      console.error("수익률 계산 데이터 로드 실패:", error);
      console.error("수익률 계산 에러 상세:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();
          // 토큰 갱신 후 다시 시도
          return await fetchCaculateData();
        } catch (refreshError) {
          console.error("토큰 갱신 실패");
          window.location.href = '/login';
          return null;
        }
      }
      
      return null;
    }
  };

  const fetchPortfolioData = async (change24hMap: { [symbol: string]: number } = {}): Promise<PortfolioData[] | null> => {
    if (!portfolioId) {
      return null;
    }
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return null;
      }

      const response = await axios.get<ApiResponse<ServerPortfolioData>>(
        `http://localhost:8080/api/v1/portfolio/${portfolioId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data.data) {
        const serverData = response.data.data;
        setPortfolioName(serverData.name);
        setServerPortfolioData(serverData);

        // 전체 포트폴리오의 현재 가치 총합을 계산 (currentPrice 기준, 없으면 purchasePrice 사용)
        const totalCurrentValue = serverData.coins.reduce((sum, coin) => {
          const price = coin.currentPrice ?? coin.purchasePrice;
          return sum + (coin.amount * price);
        }, 0);

        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    
        let convertedData: PortfolioData[] = serverData.coins.map((coin, index) => {
          const currentPrice = coin.currentPrice ?? coin.purchasePrice;
          const coinValue = coin.amount * currentPrice;
          const percentage = totalCurrentValue > 0 ? (coinValue / totalCurrentValue) * 100 : 0;
          const symbol = coin.symbol.toLowerCase();
          
          // 24시간 변동률 처리 디버깅
          const apiChange24h = change24hMap[symbol];
          const serverChange24h = coin.change_24h;
          const finalChange24h = apiChange24h ?? serverChange24h ?? 0;
          
          console.log(`코인 ${coin.symbol}: API 24h=${apiChange24h}, 서버 24h=${serverChange24h}, 최종=${finalChange24h}`);
          
          return {
            coinId: coin.id,
            coin: coin.symbol,
            amount: coin.amount,
            percentage: parseFloat(percentage.toFixed(2)),
            profit: coin.profitLoss ?? 0,
            color: colors[index % colors.length],
            price: currentPrice,
            change24h: finalChange24h, // 우선순위: API에서 받은 값 > 기존 값
            purchasePrice: coin.purchasePrice,
            purchaseDate: coin.purchaseDate // 서버에서 제공하는 매수일 사용
          };
        });
        setPortfolioData(convertedData);
        return convertedData;
      }
      return null;
    } catch (error: any) {
      
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();
          return await fetchPortfolioData(); // 토큰 갱신 후 다시 시도
        } catch (refreshError) {
        
          // 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return null;
        }
      }
      
      // 에러 시 임시 데이터 사용
      console.log('에러로 인해 임시 데이터 사용 - 에러 타입:', error.name);
      const fallbackData = [
        { coinId: 0, coin: 'BTC', amount: 0.5, percentage: 40, profit: 15.2, color: '#ff6b6b', price: 43250, change24h: 2.3, purchasePrice: 43250, purchaseDate: '2024-01-01' },
        { coinId: 0, coin: 'ETH', amount: 2.0, percentage: 30, profit: 8.7, color: '#4ecdc4', price: 2650, change24h: -1.2, purchasePrice: 2650, purchaseDate: '2024-02-01' },
        { coinId: 0, coin: 'ADA', amount: 1000, percentage: 20, profit: -5.3, color: '#45b7d1', price: 0.48, change24h: 5.8, purchasePrice: 0.48, purchaseDate: '2024-03-01' },
        { coinId: 0, coin: 'DOT', amount: 50, percentage: 10, profit: 12.1, color: '#96ceb4', price: 7.25, change24h: -0.8, purchasePrice: 7.25, purchaseDate: '2024-04-01' },
      ];
      
      setPortfolioName("샘플 포트폴리오");
      setPortfolioData(fallbackData);
      return fallbackData;
    }
  };

  // 사용 가능한 코인 목록 가져오기
  const fetchAvailableCoins = async (): Promise<AvailableCoin[]> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        return [];
      }

      const response = await axios.get<ApiResponse<AvailableCoin[]>>(
        "http://localhost:8080/api/v1/coin/list",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.data) {
        setAvailableCoins(response.data.data);
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error("코인 목록 로드 실패:", error);
      
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();
          return await fetchAvailableCoins();
        } catch (refreshError) {
          console.error("토큰 갱신 실패");
          window.location.href = '/login';
          return [];
        }
      }
      return [];
    }
  };

  // 24시간 변동률 데이터 가져오기
  const fetch24hChangeData = async (portfolioCoins: PortfolioData[]): Promise<{ [symbol: string]: number }> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        return {};
      }


      // 전달받은 포트폴리오 코인들에 대해서만 chart/history API 호출
      const coinSymbols = portfolioCoins.map(coin => coin.coin.toLowerCase());
  
      // 각 코인에 대한 API 요청을 Promise 배열로 생성
      const priceRequests = coinSymbols.map(coin => {
        const symbol = coin;
        
        // doge 코인의 경우 다른 심볼로 시도
        let requestSymbol = symbol;
        if (symbol === 'doge') {
          requestSymbol = 'dogecoin';
        }
        
        return axios.post(
          'http://localhost:8080/api/v1/chart/history',
          { 
            symbol: requestSymbol,
            days: 1  // 1일 데이터 요청
          },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        ).then(response => {
          console.log(`chart/history API 응답 성공 - ${symbol}:`, response.data);
          return {
            symbol,
            data: response.data.data || response.data
          };
        }).catch(error => {
          console.error(`chart/history API 요청 실패 - ${symbol}:`, error.response?.data || error.message);
          
          // doge 코인이 실패한 경우 원래 심볼로 다시 시도
          if (symbol === 'doge' && requestSymbol === 'dogecoin') {
            console.log(`doge 코인을 원래 심볼로 다시 시도`);
            return axios.post(
              'http://localhost:8080/api/v1/chart/history',
              { 
                symbol: 'doge',
                days: 1
              },
              {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              }
            ).then(response => {
              console.log(`chart/history API 재시도 성공 - ${symbol}:`, response.data);
              return {
                symbol,
                data: response.data.data || response.data
              };
            }).catch(retryError => {
              console.error(`chart/history API 재시도 실패 - ${symbol}:`, retryError.response?.data || retryError.message);
              return { symbol, data: null };
            });
          }
          
          return { symbol, data: null };
        });
      });

      // Promise.all로 모든 요청을 동시에 실행
      const responses = await Promise.all(priceRequests);

      // 각 코인별로 24시간 변동률 값을 추출
      const change24hMap: { [symbol: string]: number } = {};
      responses.forEach(response => {
        const { symbol, data } = response;
        if (data && data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
          // prices 배열에서 첫 번째 항목의 priceChangePercentage24h 값 추출
          const priceData = data.prices[0];
          const change24h = priceData.priceChangePercentage24h;
          
        
          if (change24h !== undefined && change24h !== null) {
            change24hMap[symbol] = change24h;
          }
        } else {
          console.log(`코인 ${symbol}: prices 데이터가 없거나 비어있음`);
        }
      });

      return change24hMap;
    } catch (error: any) {
   
      console.error("에러 상세 정보:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();
          return await fetch24hChangeData(portfolioCoins);
        } catch (refreshError) {
          console.error("토큰 갱신 실패");
          window.location.href = '/login';
          return {};
        }
      }
      return {};
    }
  };

  // 서버에서 포트폴리오 데이터 불러오기
  useEffect(() => {
    // portfolioId가 변경되면 loading 상태를 초기화
    if (portfolioId) {
      setLoading(true);
    }

    if (!isLoading && isLoggedIn && portfolioId) {
      loadData();
    } else if (!isLoading && !isLoggedIn) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      // 단, isLoading이 true일 때는 리다이렉트하지 않음 (토큰 확인 중)
      window.location.href = '/login';
    }
  }, [isLoggedIn, isLoading, portfolioId, refreshAccessToken]);

  // 로딩 중일 때 표시할 내용
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Side />
          <div className='portfolio-detail-container' style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div>로딩 중...</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 데이터가 없을 때 표시할 내용
  if (portfolioData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Side />
          <div className='portfolio-detail-container' style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div>포트폴리오 데이터를 불러올 수 없습니다.</div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 코인 비중에 따라 코닉 그라디언트 문자열 생성
  const createConicGradient = () => {
    if (!portfolioData || portfolioData.length === 0) {
      return 'lightgray'; // 데이터가 없으면 단색으로 표시
    }

    // 비중이 큰 순서대로 정렬하여 시각적으로 보기 좋게 만듭니다.
    const sortedPortfolio = [...portfolioData].sort((a, b) => b.percentage - a.percentage);

    const gradientParts = [];
    let accumulatedPercentage = 0;

    sortedPortfolio.forEach(coin => {
      if (coin.percentage > 0) {
        const start = accumulatedPercentage;
        const end = accumulatedPercentage + coin.percentage;
        gradientParts.push(`${coin.color} ${start}% ${end}%`);
        accumulatedPercentage = end;
      }
    });

    // 비중의 총합이 100% 미만일 경우, 남은 부분을 회색으로 채웁니다.
    if (accumulatedPercentage < 100) {
      gradientParts.push(`lightgray ${accumulatedPercentage}% 100%`);
    }

    return `conic-gradient(${gradientParts.join(', ')})`;
  };

  // 가격 포맷팅 함수
  const formatPrice = (price: number) => {
    // toLocaleString을 사용하여 천 단위 구분 기호를 추가하되,
    // maximumFractionDigits 옵션으로 소수점이 반올림되지 않도록 합니다.
    return `₩${(price ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 20 })}`;
  };

  // 포트폴리오 수정 함수
  const updatePortfolio = async (updateData: PortfolioUpdateRequest): Promise<boolean> => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("액세스 토큰이 없습니다.");
        return false;
      }
  
      const response = await axios.patch<ApiResponse<null>>(
        `http://localhost:8080/api/v1/portfolio-coins/edit`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.data.statusCode === 200) {
        alert(response.data.message || "포트폴리오가 성공적으로 수정되었습니다.");
        loadData(); // 데이터 새로고침
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("포트폴리오 수정 실패:", error);
      alert(error.response?.data?.message || "포트폴리오 수정에 실패했습니다.");
      return false;
    }
  };

  // 편집 모달 열기
  const openEditModal = async () => {
    await fetchAvailableCoins();
    if (serverPortfolioData) {
      const initialCoins: CoinInfo[] = serverPortfolioData.coins.map(coin => ({
        portfolioCoinId: coin.portfolioCoinId,
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amount: coin.amount,
        purchasePrice: coin.purchasePrice,
        purchaseDate: coin.purchaseDate ? coin.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      setEditingCoins(initialCoins);
      setInitialEditingCoins(initialCoins);
    }
    setShowEditModal(true);
  };

  // 편집 모달 닫기
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCoins([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Side />
        <div className='portfolio-detail-container' style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ padding: '20px', width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button
                onClick={openEditModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                포트폴리오 편집
              </button>
            </div>
            
            {/* 포트폴리오 분포 차트 */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '20px' }}>{portfolioName}</h1>
                <h2>포트폴리오 분포</h2>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: createConicGradient(),
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      총 {portfolioData.length}개
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 코인 목록 테이블 */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>보유 코인</h2>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <table style={{ width: '100%', maxWidth: '800px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>코인</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>보유량</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>비중</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>구매가</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>현재가</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>수익률</th>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>24h 변동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.map((coin, index) => {
                      // 서버에서 받은 코인별 수익률 데이터에서 해당 코인 찾기
                      const serverProfitData = coinProfitData.find(profitCoin => {
                        const portfolioCoinLower = coin.coin.toLowerCase();
                        const serverCoinLower = profitCoin.fullName.toLowerCase();
                        
                        console.log(`매칭 시도: portfolioCoin=${portfolioCoinLower}, serverCoin=${serverCoinLower}`);
                        
                        // 정확한 매칭 시도
                        if (portfolioCoinLower === serverCoinLower) {
                          console.log(`정확한 매칭 성공: ${portfolioCoinLower}`);
                          return true;
                        }
                        
                        // 부분 매칭 시도
                        if (serverCoinLower.includes(portfolioCoinLower) || portfolioCoinLower.includes(serverCoinLower)) {
                          console.log(`부분 매칭 성공: ${portfolioCoinLower} <-> ${serverCoinLower}`);
                          return true;
                        }
                        
                        // USDe 같은 특수한 경우 처리
                        if (portfolioCoinLower === 'usde' && serverCoinLower.includes('usde')) {
                          console.log(`USDe 특수 매칭 성공: ${portfolioCoinLower}`);
                          return true;
                        }
                        
                        // 심볼 매칭 시도 (Bitcoin -> btc, Tether -> usdt 등)
                        const symbolMappings: { [key: string]: string[] } = {
                          'btc': ['bitcoin'],
                          'usdt': ['tether'],
                          'usde': ['usde', 'ethena usde'],
                          'doge': ['dogecoin'],
                          'eth': ['ethereum'],
                          'bnb': ['binance coin', 'bnb'],
                          'sol': ['solana'],
                          'ada': ['cardano'],
                          'xrp': ['ripple'],
                          'dot': ['polkadot'],
                          'link': ['chainlink'],
                          'ltc': ['litecoin'],
                          'bch': ['bitcoin cash'],
                          'xlm': ['stellar'],
                          'uni': ['uniswap'],
                          'atom': ['cosmos'],
                          'etc': ['ethereum classic'],
                          'vet': ['vechain'],
                          'icp': ['internet computer'],
                          'fil': ['filecoin']
                        };
                        
                        const possibleNames = symbolMappings[portfolioCoinLower];
                        if (possibleNames && possibleNames.some(name => serverCoinLower.includes(name))) {
                          console.log(`심볼 매칭 성공: ${portfolioCoinLower} -> ${serverCoinLower}`);
                          return true;
                        }
                        
                        console.log(`매칭 실패: ${portfolioCoinLower} <-> ${serverCoinLower}`);
                        return false;
                      });
                      
                      console.log(`최종 결과: ${coin.coin} -> ${serverProfitData ? serverProfitData.profitLoss : '매칭 실패'}`);
                      
                      return (
                        <tr
                          key={`${coin.coin}-${index}`}
                          style={{
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ width: '10px', height: '10px', backgroundColor: coin.color, borderRadius: '50%', marginRight: '10px' }}></span>
                              <span>{coin.coin.toUpperCase()}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>{coin.amount ?? 0}</td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                            {(coin.percentage ?? 100) === 100 
                              ? '100%' 
                              : `${(coin.percentage ?? 0).toFixed(2)}%`}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                            {formatPrice(coin.purchasePrice ?? 0)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                            {formatPrice(coin.price ?? 0)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                            {serverProfitData ? (
                              <span style={{ color: serverProfitData.profitLoss >= 0 ? '#28a745' : '#dc3545' }}>
                                {serverProfitData.profitLoss >= 0 ? '+' : ''}{serverProfitData.profitLoss.toFixed(2)}%
                              </span>
                            ) : (
                              <span style={{ color: '#888' }}>계산 중...</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{ color: (coin.change24h ?? 0) >= 0 ? '#28a745' : '#dc3545' }}>
                              {(coin.change24h ?? 0) >= 0 ? '+' : ''}{(coin.change24h ?? 0).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* 포트폴리오 편집 모달 */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>포트폴리오 편집</h2>
              <button
                onClick={closeEditModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                포트폴리오 제목:
              </label>
              <input
                type="text"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>보유 코인</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>코인</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>보유량</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>매수가</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>매수일</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {editingCoins.map((coin, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>
                        <select
                          value={coin.coinId}
                          onChange={(e) => {
                            const selectedCoinId = parseInt(e.target.value);
                            const selectedCoin = availableCoins.find(c => c.id === selectedCoinId);
                            const newCoins = [...editingCoins];
                            newCoins[index] = {
                              ...newCoins[index],
                              coinId: selectedCoinId,
                              symbol: selectedCoin?.symbol || '',
                              name: selectedCoin?.name || ''
                            };
                            setEditingCoins(newCoins);
                          }}
                          style={{
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '2px',
                            width: '100px',
                          }}
                        >
                          <option value={0}>코인 선택</option>
                          {availableCoins.map((availableCoin) => (
                            <option key={availableCoin.id} value={availableCoin.id}>
                              {availableCoin.symbol.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                        <input
                          type="number"
                          value={coin.amount}
                          onChange={(e) => {
                            const newCoins = [...editingCoins];
                            newCoins[index].amount = parseFloat(e.target.value) || 0;
                            setEditingCoins(newCoins);
                          }}
                          style={{
                            width: '80px',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '2px',
                            textAlign: 'right',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                        <input
                          type="number"
                          value={coin.purchasePrice}
                          onChange={(e) => {
                            const newCoins = [...editingCoins];
                            newCoins[index].purchasePrice = parseFloat(e.target.value) || 0;
                            setEditingCoins(newCoins);
                          }}
                          style={{
                            width: '100px',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '2px',
                            textAlign: 'right',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                        <input
                          type="date"
                          value={coin.purchaseDate}
                          onChange={(e) => {
                            const newCoins = [...editingCoins];
                            newCoins[index].purchaseDate = e.target.value;
                            setEditingCoins(newCoins);
                          }}
                          style={{
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '2px',
                            width: '140px',
                            textAlign: 'center',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                        <button
                          onClick={() => {
                            const newCoins = [...editingCoins];
                            newCoins.splice(index, 1);
                            setEditingCoins(newCoins);
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  // 새 코인 추가 로직
                  const newCoin: CoinInfo = {
                    coinId: 0, // 선택되지 않은 상태
                    symbol: '',
                    name: '',
                    amount: 0,
                    purchasePrice: 0,
                    purchaseDate: new Date().toISOString().split('T')[0]
                  };
                  setEditingCoins([...editingCoins, newCoin]);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                코인 추가
              </button>

              <button
                onClick={async () => {
                  // 유효성 검사
                  const hasInvalidCoins = editingCoins.some(coin => 
                    coin.coinId === 0 || coin.amount <= 0 || coin.purchasePrice <= 0
                  );
                  
                  if (hasInvalidCoins) {
                    alert('모든 코인을 선택하고 보유량과 매수가를 입력해주세요.');
                    return;
                  }

                  const initialCoinMap = new Map(initialEditingCoins.map(c => [c.portfolioCoinId, c]));

                  const toAdd: CoinUpdatePayload[] = editingCoins
                    .filter(c => c.portfolioCoinId === undefined)
                    .map(({ coinId, amount, purchasePrice, purchaseDate }) => ({
                      coinId, amount, purchasePrice, purchaseDate: new Date(purchaseDate).toISOString()
                    }));

                  const toUpdate: CoinToUpdatePayload[] = editingCoins
                    .filter(c => c.portfolioCoinId !== undefined)
                    .filter(c => {
                      const initial = initialCoinMap.get(c.portfolioCoinId);
                      return initial && (
                        initial.amount !== c.amount ||
                        initial.purchasePrice !== c.purchasePrice ||
                        initial.purchaseDate.split('T')[0] !== c.purchaseDate
                      );
                    })
                    .map(({ portfolioCoinId, coinId, amount, purchasePrice, purchaseDate }) => ({
                      portfolioCoinId: portfolioCoinId!,
                      coinId, amount, purchasePrice, purchaseDate: new Date(purchaseDate).toISOString()
                    }));

                  const editingCoinIds = new Set(editingCoins.map(c => c.portfolioCoinId));
                  const toDelete: number[] = initialEditingCoins
                    .filter(c => c.portfolioCoinId !== undefined && !editingCoinIds.has(c.portfolioCoinId))
                    .map(c => c.portfolioCoinId!);
                  
                  // 변경사항 저장
                  const updateData: PortfolioUpdateRequest = {
                    portfolioId: Number(portfolioId),
                    toAdd,
                    toUpdate,
                    toDelete,
                  };
                  
                  const success = await updatePortfolio(updateData);
                  if (success) {
                    closeEditModal();
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDetail;